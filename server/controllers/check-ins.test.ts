import httpMocks from 'node-mocks-http'
import controllers from '.'
import { mockAppResponse } from './mocks'
import { isValidCrn, isValidUUID, setDataValue } from '../utils'
import { renderError } from '../middleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import { PersonalDetails } from '../data/model/personalDetails'
import { defaultUser } from './mocks/alerts'
import logger from '../../logger'
import { postCheckInDetails } from '../middleware/postCheckInDetails'

jest.mock('../../logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}))

jest.mock('../middleware/postCheckInDetails', () => ({
  postCheckInDetails: jest.fn(
    () => (req: any, res: any) =>
      Promise.resolve({
        setup: { id: 'setup-1' },
        uploadLocation: 's3://bucket/key',
      }),
  ),
}))

jest.mock('../data/masApiClient')
jest.mock('../data/tokenStore/redisTokenStore')
jest.mock('@ministryofjustice/hmpps-audit-client')

const mockMiddlewareFn = jest.fn()
jest.mock('../middleware', () => ({
  renderError: jest.fn(() => mockMiddlewareFn),
}))

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    isValidCrn: jest.fn(),
    isValidUUID: jest.fn(),
    setDataValue: jest.fn(),
  }
})

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'f1654ea3-0abb-46eb-860b-654a96edbe20'),
}))

jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})

const mockPersonalDetails = {} as PersonalDetails

const getPersonalDetailsSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonalDetails')
  .mockImplementation(() => Promise.resolve(mockPersonalDetails))

const mockIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>
const mockIsValidUUID = isValidUUID as jest.MockedFunction<typeof isValidUUID>
const mockRenderError = renderError as jest.MockedFunction<typeof renderError>
const mockSetDataValue = setDataValue as jest.MockedFunction<typeof setDataValue>
const mockPostCheckInDetails = postCheckInDetails as jest.MockedFunction<typeof postCheckInDetails>

const crn = 'X000001'
const uuid = 'f1654ea3-0abb-46eb-860b-654a96edbe20'

const baseReq = () =>
  httpMocks.createRequest({
    params: { crn, id: uuid },
    session: {},
  })

const res = mockAppResponse()
const renderSpy = jest.spyOn(res, 'render')
const redirectSpy = jest.spyOn(res, 'redirect')
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>

describe('checkInsController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  describe('getIntroPage', () => {
    it('renders instructions when CRN is valid', async () => {
      mockIsValidCrn.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getIntroPage(hmppsAuthClient)(req, res)

      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/instructions.njk', { crn })
      expect(mockRenderError).not.toHaveBeenCalled()
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getIntroPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('postIntroPage', () => {
    it('redirects to date-frequency with generated id when CRN is valid', async () => {
      mockIsValidCrn.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postIntroPage(hmppsAuthClient)(req, res)

      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/${uuid}/check-in/date-frequency`)
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.postIntroPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('getDateFrequencyPage', () => {
    it('renders with min date using single-digit day format (d/M/yyyy)', async () => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2025-07-01T09:00:00Z'))

      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getDateFrequencyPage(hmppsAuthClient)(req, res)

      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/date-frequency.njk', {
        crn,
        id: uuid,
        checkInMinDate: '2/7/2025',
      })
    })

    it('renders with min date using double-digit day format (dd/M/yyyy)', async () => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2025-07-09T09:00:00Z'))

      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getDateFrequencyPage(hmppsAuthClient)(req, res)

      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/date-frequency.njk', {
        crn,
        id: uuid,
        checkInMinDate: '10/7/2025',
      })
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getDateFrequencyPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getDateFrequencyPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('postDateFrequencyPage', () => {
    it('redirects to contact-preference when CRN and id are valid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postDateFrequencyPage(hmppsAuthClient)(req, res)

      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/${uuid}/check-in/contact-preference`)
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postDateFrequencyPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.postDateFrequencyPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('getContactPreferencePage', () => {
    it('renders contact preference page with mobile and email, stores edit values in session, and calls MAS with token', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      // Arrange personal details returned by MAS
      ;(mockPersonalDetails as PersonalDetails).mobileNumber = '07700900000'
      ;(mockPersonalDetails as PersonalDetails).email = 'test@example.com'

      const req = baseReq()
      await controllers.checkIns.getContactPreferencePage(hmppsAuthClient)(req, res)

      // token retrieval and MAS client call
      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user-1')
      expect(getPersonalDetailsSpy).toHaveBeenCalledWith(crn)

      // stores edit values in session via setDataValue
      expect(mockSetDataValue).toHaveBeenCalledWith(
        req.session.data,
        ['esupervision', crn, uuid, 'checkins', 'editCheckInMobile'],
        '07700900000',
      )
      expect(mockSetDataValue).toHaveBeenCalledWith(
        req.session.data,
        ['esupervision', crn, uuid, 'checkins', 'editCheckInEmail'],
        'test@example.com',
      )

      // render with contact details
      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/contact-preference.njk', {
        crn,
        id: uuid,
        checkInMobile: '07700900000',
        checkInEmail: 'test@example.com',
      })
    })

    it('copies session errorMessages to res.locals and deletes them', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      req.session.errorMessages = { text: 'Something went wrong', href: '#checkInEmail' }

      await controllers.checkIns.getContactPreferencePage(hmppsAuthClient)(req, res)

      expect(res.locals.errorMessages).toEqual({ text: 'Something went wrong', href: '#checkInEmail' })
      expect(req.session.errorMessages).toBeUndefined()
    })

    it('sets success flag when contactUpdated is present and removes the flag from session', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      req.session.data = {
        esupervision: {
          [crn]: {
            [uuid]: {
              checkins: {
                contactUpdated: true,
              },
            },
          },
        },
      }

      await controllers.checkIns.getContactPreferencePage(hmppsAuthClient)(req, res)

      expect(res.locals.success).toBe(true)
      expect(
        req.session.data?.esupervision?.[crn]?.[uuid]?.checkins?.contactUpdated as unknown as boolean | undefined,
      ).toBeUndefined()
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getContactPreferencePage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getContactPreferencePage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('getEditContactPrePage', () => {
    it('renders edit contact preference when CRN and id are valid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getEditContactPrePage(hmppsAuthClient)(req, res)

      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/edit-contact-preference.njk', { crn, id: uuid })
      expect(mockRenderError).not.toHaveBeenCalled()
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getEditContactPrePage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getEditContactPrePage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('postEditContactPrePage', () => {
    it('returns 404 when CRN or id invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.postEditContactPrePage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('updates personal details, sets session flag and redirects on success', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const data = {
        esupervision: {
          [crn]: {
            [uuid]: {
              checkins: {
                editCheckInEmail: 'test@example.com',
                editCheckInMobile: '07700900000',
              },
            },
          },
        },
      }

      const req = httpMocks.createRequest({
        params: { crn, id: uuid },
        session: { data },
      })
      res.locals.user = defaultUser
      const updateSpy = jest
        .spyOn(MasApiClient.prototype, 'updatePersonalDetailsContact')
        .mockImplementation(() => Promise.resolve({ crn } as PersonalDetails))

      await controllers.checkIns.postEditContactPrePage(hmppsAuthClient)(req, res)

      expect(updateSpy).toHaveBeenCalledWith(crn, {
        emailAddress: 'test@example.com',
        mobileNumber: '07700900000',
      })
      expect(mockSetDataValue).toHaveBeenCalledWith(
        data,
        ['esupervision', crn, uuid, 'checkins', 'contactUpdated'],
        true,
      )
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/${uuid}/check-in/contact-preference`)
    })
  })

  describe('postContactPreferencePage', () => {
    it('redirects to photo-options when CRN and id are valid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postContactPreferencePage(hmppsAuthClient)(req, res)

      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/${uuid}/check-in/photo-options`)
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postContactPreferencePage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.postContactPreferencePage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('postPhotoOptionsPage', () => {
    it('renders photo options page when, CRN and id are valid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postPhotoOptionsPage(hmppsAuthClient)(req, res)

      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/${uuid}/check-in/upload-a-photo`)
      expect(mockRenderError).not.toHaveBeenCalled()
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postPhotoOptionsPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.postPhotoOptionsPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('getTakePhotoPage', () => {
    it('renders take a photo page when CRN and id are valid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getTakePhotoPage(hmppsAuthClient)(req, res)

      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/take-a-photo.njk', { crn, id: uuid })
      expect(mockRenderError).not.toHaveBeenCalled()
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getTakePhotoPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getTakePhotoPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('getUploadPhotoPage', () => {
    it('renders upload a photo page when CRN and id are valid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getUploadPhotoPage(hmppsAuthClient)(req, res)

      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/upload-a-photo.njk', { crn, id: uuid })
      expect(mockRenderError).not.toHaveBeenCalled()
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getUploadPhotoPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getUploadPhotoPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('postUploadaPhotoPage', () => {
    it('renders photo rules page when, CRN and id are valid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postUploadaPhotoPage(hmppsAuthClient)(req, res)

      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/${uuid}/check-in/photo-rules`)
      expect(mockRenderError).not.toHaveBeenCalled()
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postUploadaPhotoPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.postUploadaPhotoPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('getPhotoRulesPage', () => {
    it('renders photo rules page when CRN and id are valid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getPhotoRulesPage(hmppsAuthClient)(req, res)

      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/photo-rules.njk', { crn, id: uuid })
      expect(mockRenderError).not.toHaveBeenCalled()
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getPhotoRulesPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getPhotoRulesPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('getCheckinSummaryPage', () => {
    const baseSessionData = {
      esupervision: {
        [crn]: {
          [uuid]: {
            checkins: {
              interval: 'WEEKLY',
              preferredComs: 'EMAIL',
              photoUploadOption: 'TAKE_A_PIC',
            },
          },
        },
      },
    }

    it('renders summary with transformed userDetails when CRN and id are valid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = httpMocks.createRequest({
        params: { crn, id: uuid },
        session: { data: baseSessionData },
      })

      await controllers.checkIns.getCheckinSummaryPage(hmppsAuthClient)(req, res)

      expect(renderSpy).toHaveBeenCalledWith(
        'pages/check-in/checkin-summary.njk',
        expect.objectContaining({
          crn,
          id: uuid,
          userDetails: expect.objectContaining({
            uuid,
            interval: 'Every week',
            preferredComs: 'Email',
            photoUploadOption: 'Take a photo using this device',
          }),
        }),
      )
      expect(mockRenderError).not.toHaveBeenCalled()
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getCheckinSummaryPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getCheckinSummaryPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('postCheckinSummaryPage', () => {
    it('returns JSON with setup and uploadLocation and logs info on success', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postCheckinSummaryPage(hmppsAuthClient)(req, res)

      expect(res.json).toHaveBeenCalledWith({
        status: 'SUCCESS',
        message: 'Registration complete',
        setup: { id: 'setup-1' },
        uploadLocation: 's3://bucket/key',
      })
      expect(logger.info).toHaveBeenCalledWith('Check-in registration response', {
        status: 'SUCCESS',
        message: 'Registration complete',
        setup: { id: 'setup-1' },
        uploadLocation: 's3://bucket/key',
      })
    })

    it('does not call res.json when middleware throws (error already handled)', async () => {
      mockPostCheckInDetails.mockImplementationOnce(() => async () => {
        throw new Error('boom')
      })

      const req = baseReq()
      await controllers.checkIns.postCheckinSummaryPage(hmppsAuthClient)(req, res)

      expect(res.json).not.toHaveBeenCalled()
    })
  })

  describe('getConfirmationPage', () => {
    it('renders confirmation with computed displayCommsOption and displayDay', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const data = {
        esupervision: {
          [crn]: {
            [uuid]: {
              checkins: {
                date: '2/7/2025',
                interval: 'WEEKLY',
                preferredComs: 'EMAIL',
                checkInEmail: 'person@example.com',
                checkInMobile: '07000000000',
              },
            },
          },
        },
      }

      const req = httpMocks.createRequest({
        params: { crn, id: uuid },
        session: { data },
      })

      await controllers.checkIns.getConfirmationPage(hmppsAuthClient)(req, res)

      expect(renderSpy).toHaveBeenCalled()
      const [template, context] = (renderSpy as jest.Mock).mock.calls.pop()
      expect(template).toBe('pages/check-in/confirmation.njk')
      expect(context.crn).toBe(crn)
      expect(context.id).toBe(uuid)
      expect(context.userDetails.uuid).toBe(uuid)
      expect(context.userDetails.interval).toBe('Every week')
      expect(context.userDetails.displayCommsOption).toBe('person@example.com')
      expect(context.userDetails.displayDay).toBe('Wednesday')
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getConfirmationPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getConfirmationPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('postPhotoRulesPage', () => {
    it('renders photo rules page when CRN and id are valid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postPhotoRulesPage(hmppsAuthClient)(req, res)

      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/${uuid}/check-in/checkin-summary`)
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postPhotoRulesPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.postPhotoRulesPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })
})
