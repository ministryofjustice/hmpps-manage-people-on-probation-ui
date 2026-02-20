import { logger } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import httpMocks from 'node-mocks-http'
import controllers from '.'
import { mockAppResponse } from './mocks'
import { getDataValue, isValidCrn, isValidUUID, setDataValue } from '../utils'
import { renderError } from '../middleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import { PersonalDetails } from '../data/model/personalDetails'
import { defaultUser } from './mocks/alerts'
import { postCheckInDetails } from '../middleware/postCheckInDetails'
import { ProbationPractitioner } from '../models/CaseDetail'
import ESupervisionClient from '../data/eSupervisionClient'
import { CheckinScheduleResponse, ESupervisionCheckIn } from '../data/model/esupervision'

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
jest.mock('../data/eSupervisionClient')
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

const postReviewSpy = jest
  .spyOn(ESupervisionClient.prototype, 'postOffenderCheckInReview')
  .mockImplementation(() => Promise.resolve({} as ESupervisionCheckIn))
const postReviewNoteSpy = jest
  .spyOn(ESupervisionClient.prototype, 'postOffenderCheckInNote')
  .mockImplementation(() => Promise.resolve())
const startReviewSpy = jest
  .spyOn(ESupervisionClient.prototype, 'postOffenderCheckInStarted')
  .mockImplementation(() => Promise.resolve({} as ESupervisionCheckIn))

const getProbationPractitionerSpy = jest
  .spyOn(MasApiClient.prototype, 'getProbationPractitioner')
  .mockImplementation(() => Promise.resolve({ username: 'name' } as ProbationPractitioner))
const mockPersonalDetails = {} as PersonalDetails
const getPersonalDetailsSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonalDetails')
  .mockImplementation(() => Promise.resolve(mockPersonalDetails))

const updatePersonalDetailsSpy = jest
  .spyOn(MasApiClient.prototype, 'updatePersonalDetailsContact')
  .mockImplementation(() => Promise.resolve({ crn } as PersonalDetails))

const postDeactivateOffender = jest
  .spyOn(ESupervisionClient.prototype, 'postDeactivateOffender')
  .mockImplementation(() => Promise.resolve({} as CheckinScheduleResponse))

const postUpdateOffenderDetailsSpy = jest
  .spyOn(ESupervisionClient.prototype, 'postUpdateOffenderDetails')
  .mockImplementation(() => Promise.resolve({} as CheckinScheduleResponse))

const mockIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>
const mockIsValidUUID = isValidUUID as jest.MockedFunction<typeof isValidUUID>
const mockRenderError = renderError as jest.MockedFunction<typeof renderError>
const mockSetDataValue = setDataValue as jest.MockedFunction<typeof setDataValue>
const mockGetDataValue = getDataValue as jest.MockedFunction<typeof getDataValue>
const mockPostCheckInDetails = postCheckInDetails as jest.MockedFunction<typeof postCheckInDetails>

const crn = 'X000001'
const cya = false
const uuid = 'f1654ea3-0abb-46eb-860b-654a96edbe20'

const baseReq = (data?: any) =>
  httpMocks.createRequest({
    params: { crn, id: uuid },
    session: { data },
    query: {
      back: 'string',
    },
    url: 'url',
  })

const reviewRes = (status: string, reviewedAt?: string) => mockAppResponse({ checkIn: { status, reviewedAt } })

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
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getIntroPage(hmppsAuthClient)(req, res)

      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/instructions.njk', {
        crn,
        back: req.query.back,
        guidanceUrl: 'https://probation-check-in-dev.hmpps.service.justice.gov.uk',
      })
      expect(mockRenderError).not.toHaveBeenCalled()
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getIntroPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('redirect if no practitioner', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      getProbationPractitionerSpy.mockImplementationOnce(() =>
        Promise.resolve({ unallocated: true } as ProbationPractitioner),
      )

      const req = baseReq()
      await controllers.checkIns.getIntroPage(hmppsAuthClient)(req, res)

      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments`)
    })
  })

  describe('postIntroPage', () => {
    it('redirects to date-frequency with generated id when CRN is valid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postIntroPage(hmppsAuthClient)(req, res)

      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/${uuid}/check-in/date-frequency`)
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

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
        checkInMinDate: '1/7/2025',
        cya,
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
        checkInMinDate: '9/7/2025',
        cya,
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
                editCheckInMobile: '  07700900000     ',
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

    it('updates session personalDetails overview when present', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const existingOverview = { crn: 'X10100', mobileNumber: '07856984552' }
      const data = {
        personalDetails: {
          [crn]: {
            overview: existingOverview,
          },
        },
        esupervision: {
          [crn]: {
            [uuid]: {
              checkins: {
                editCheckInEmail: 'new@example.com',
                editCheckInMobile: '07123456789',
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
      await controllers.checkIns.postEditContactPrePage(hmppsAuthClient)(req, res)
      expect(req.session.data.personalDetails[crn].overview).toEqual({ crn })
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/${uuid}/check-in/contact-preference`)
    })
  })

  describe('postContactPreferencePage', () => {
    it('redirects to photo-options when CRN and id are valid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)
      const req = httpMocks.createRequest({
        params: { crn, id: uuid },
        body: { change: 'main' },
      })
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

      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/take-a-photo.njk', { crn, id: uuid, cya })
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

      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/upload-a-photo.njk', { crn, id: uuid, cya })
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

  describe('postTakeAPhotoPage', () => {
    it('redirects to photo rules with selected upload option when CRN and id are valid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = httpMocks.createRequest({
        params: { crn, id: uuid },
        body: { userPhotoUpload: 'TAKE_A_PIC' },
      })

      await controllers.checkIns.postTakeAPhotoPage(hmppsAuthClient)(req, res)

      expect(redirectSpy).toHaveBeenCalledWith(
        `/case/${crn}/appointments/${uuid}/check-in/photo-rules?photoUpload=TAKE_A_PIC`,
      )
      expect(mockRenderError).not.toHaveBeenCalled()
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = httpMocks.createRequest({
        params: { crn, id: uuid },
        body: { userPhotoUpload: 'UPLOAD' },
      })

      await controllers.checkIns.postTakeAPhotoPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = httpMocks.createRequest({
        params: { crn, id: uuid },
        body: { userPhotoUpload: 'UPLOAD' },
      })

      await controllers.checkIns.postTakeAPhotoPage(hmppsAuthClient)(req, res)

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
      expect(logger.info).toHaveBeenCalledWith('Check-in registration successful')
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

  describe('getUpdateCheckIn', () => {
    it('redirect to view page if checkIn already reviewed', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      const resReview = reviewRes('REVIEWED')
      const reviewRedirectSpy = jest.spyOn(resReview, 'redirect')
      await controllers.checkIns.getUpdateCheckIn(hmppsAuthClient)(req, resReview)

      expect(reviewRedirectSpy).toHaveBeenCalledWith(
        `/case/${req.params.crn}/appointments/${req.params.id}/check-in/view?back=${req.query.back}`,
      )
    })

    it('redirect to confirm identity page if checkIn was submitted', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      const resReview = reviewRes('SUBMITTED')
      const reviewRedirectSpy = jest.spyOn(resReview, 'redirect')
      await controllers.checkIns.getUpdateCheckIn(hmppsAuthClient)(req, resReview)

      expect(startReviewSpy).toHaveBeenCalled()
      expect(reviewRedirectSpy).toHaveBeenCalledWith(
        `/case/${req.params.crn}/appointments/${req.params.id}/check-in/review/identity?back=${req.query.back}`,
      )
    })

    it('redirect to missed appointment notes page if checkIn expired', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      const resReview = reviewRes('EXPIRED')
      const reviewRedirectSpy = jest.spyOn(resReview, 'redirect')
      await controllers.checkIns.getUpdateCheckIn(hmppsAuthClient)(req, resReview)

      expect(startReviewSpy).toHaveBeenCalled()
      expect(reviewRedirectSpy).toHaveBeenCalledWith(
        `/case/${req.params.crn}/appointments/${req.params.id}/check-in/review/expired?back=${req.query.back}`,
      )
    })

    it('practitionerId is locals username if no username returned by API', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      getProbationPractitionerSpy.mockImplementationOnce(() => Promise.resolve({} as ProbationPractitioner))

      const req = baseReq()
      const resReview = reviewRes('EXPIRED')
      await controllers.checkIns.getUpdateCheckIn(hmppsAuthClient)(req, resReview)

      expect(startReviewSpy).toHaveBeenCalledWith(req.params.id, resReview.locals.user.username)
    })

    it('returns 404 when checkIn status is invalid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      const resReview = reviewRes('INVALID')
      await controllers.checkIns.getUpdateCheckIn(hmppsAuthClient)(req, resReview)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, resReview)
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getUpdateCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getUpdateCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id and crn are invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getUpdateCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('getViewCheckIn', () => {
    it('redirect if checkIn not reviewed', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      const resReview = reviewRes('SUBMITTED')
      const reviewRedirectSpy = jest.spyOn(resReview, 'redirect')
      await controllers.checkIns.getViewCheckIn(hmppsAuthClient)(req, resReview)

      expect(reviewRedirectSpy).toHaveBeenCalledWith(
        `/case/${req.params.crn}/appointments/${req.params.id}/check-in/update?back=${req.query.back}`,
      )
    })

    it('render checkIn view page if correct', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      const resReview = reviewRes('REVIEWED')
      const reviewRenderSpy = jest.spyOn(resReview, 'render')
      await controllers.checkIns.getViewCheckIn(hmppsAuthClient)(req, resReview)

      expect(reviewRenderSpy).toHaveBeenCalledWith('pages/check-in/view.njk', {
        crn: req.params.crn,
        id: req.params.id,
        back: req.query.back,
        checkIn: resReview.locals.checkIn,
        videoLink: `/case/${req.params.crn}/appointments/${req.params.id}/check-in/video?back=${req.url}`,
      })
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getViewCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getViewCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id and crn are invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getViewCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('getReviewExpiredCheckIn', () => {
    it('redirect if checkIn not expired', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      const resReview = reviewRes('SUBMITTED')
      const reviewRedirectSpy = jest.spyOn(resReview, 'redirect')
      await controllers.checkIns.getReviewExpiredCheckIn(hmppsAuthClient)(req, resReview)

      expect(reviewRedirectSpy).toHaveBeenCalledWith(
        `/case/${req.params.crn}/appointments/${req.params.id}/check-in/update?back=${req.query.back}`,
      )
    })

    it('render checkIn expired page if correct', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      const resReview = reviewRes('EXPIRED')
      const reviewRenderSpy = jest.spyOn(resReview, 'render')
      await controllers.checkIns.getReviewExpiredCheckIn(hmppsAuthClient)(req, resReview)

      expect(reviewRenderSpy).toHaveBeenCalledWith('pages/check-in/review/expired.njk', {
        crn: req.params.crn,
        id: req.params.id,
        back: req.query.back,
        checkIn: resReview.locals.checkIn,
      })
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getReviewExpiredCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getReviewExpiredCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id and crn are invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getReviewExpiredCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('getViewExpiredCheckIn', () => {
    it('redirect if checkIn not expired or not comment', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      const resReview = reviewRes('EXPIRED')
      const reviewRedirectSpy = jest.spyOn(resReview, 'redirect')
      await controllers.checkIns.getViewExpiredCheckIn(hmppsAuthClient)(req, resReview)

      expect(reviewRedirectSpy).toHaveBeenCalledWith(
        `/case/${req.params.crn}/appointments/${req.params.id}/check-in/update?back=${req.query.back}`,
      )
    })

    it('render checkIn expired-view page if correct', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      const resReview = reviewRes('EXPIRED', 'comment')
      const reviewRenderSpy = jest.spyOn(resReview, 'render')
      await controllers.checkIns.getViewExpiredCheckIn(hmppsAuthClient)(req, resReview)

      expect(reviewRenderSpy).toHaveBeenCalledWith('pages/check-in/view-expired.njk', {
        crn: req.params.crn,
        id: req.params.id,
        back: req.query.back,
        checkIn: resReview.locals.checkIn,
      })
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getViewExpiredCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getViewExpiredCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id and crn are invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getViewExpiredCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('getReviewIdentityCheckIn', () => {
    it('redirect if checkIn not submitted', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      const resReview = reviewRes('EXPIRED')
      const reviewRedirectSpy = jest.spyOn(resReview, 'redirect')
      await controllers.checkIns.getReviewIdentityCheckIn(hmppsAuthClient)(req, resReview)

      expect(reviewRedirectSpy).toHaveBeenCalledWith(
        `/case/${req.params.crn}/appointments/${req.params.id}/check-in/update?back=${req.query.back}`,
      )
    })

    it('render checkIn identity page if correct', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      const resReview = reviewRes('SUBMITTED')
      const reviewRenderSpy = jest.spyOn(resReview, 'render')
      await controllers.checkIns.getReviewIdentityCheckIn(hmppsAuthClient)(req, resReview)

      expect(reviewRenderSpy).toHaveBeenCalledWith('pages/check-in/review/identity.njk', {
        crn: req.params.crn,
        id: req.params.id,
        back: req.query.back,
        checkIn: resReview.locals.checkIn,
        videoLink: `/case/${req.params.crn}/appointments/${req.params.id}/check-in/video?back=${req.url}`,
      })
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getReviewIdentityCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getReviewIdentityCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id and crn are invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getReviewIdentityCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('getReviewNotesCheckIn', () => {
    it('redirect if checkIn not submitted', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const data = {
        esupervision: {
          [crn]: {
            [uuid]: {
              checkins: {
                manualIdCheck: 'MATCH',
              },
            },
          },
        },
      }
      const req = baseReq(data)
      const resReview = reviewRes('EXPIRED')
      const reviewRedirectSpy = jest.spyOn(resReview, 'redirect')
      await controllers.checkIns.getReviewNotesCheckIn(hmppsAuthClient)(req, resReview)

      expect(reviewRedirectSpy).toHaveBeenCalledWith(
        `/case/${req.params.crn}/appointments/${req.params.id}/check-in/update?back=${req.query.back}`,
      )
    })

    it('redirect if no manualIdCheck', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      const resReview = reviewRes('EXPIRED')
      const reviewRedirectSpy = jest.spyOn(resReview, 'redirect')
      await controllers.checkIns.getReviewNotesCheckIn(hmppsAuthClient)(req, resReview)

      expect(reviewRedirectSpy).toHaveBeenCalledWith(req.query.back)
    })

    it('render checkIn notes page if correct', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const data = {
        esupervision: {
          [crn]: {
            [uuid]: {
              checkins: {
                manualIdCheck: 'MATCH',
              },
            },
          },
        },
      }
      const req = baseReq(data)
      const resReview = reviewRes('SUBMITTED')
      const reviewRenderSpy = jest.spyOn(resReview, 'render')
      await controllers.checkIns.getReviewNotesCheckIn(hmppsAuthClient)(req, resReview)

      expect(reviewRenderSpy).toHaveBeenCalledWith('pages/check-in/review/notes.njk', {
        crn: req.params.crn,
        id: req.params.id,
        back: req.query.back,
        checkIn: resReview.locals.checkIn,
      })
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getReviewNotesCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getReviewNotesCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
    it('returns 404 when id and crn are invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getReviewNotesCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('postReviewIdentityCheckIn', () => {
    it('redirect to notes page', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postReviewIdentityCheckIn(hmppsAuthClient)(req, res)

      expect(redirectSpy).toHaveBeenCalledWith(
        `/case/${req.params.crn}/appointments/${req.params.id}/check-in/review/notes?back=${req.url}`,
      )
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postReviewIdentityCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.postReviewIdentityCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
    it('returns 404 when id and crn are invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.postReviewIdentityCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('postViewCheckIn', () => {
    it('should stay on existing page', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const data = {
        esupervision: {
          [crn]: {
            [uuid]: {
              checkins: {
                note: 'note',
              },
            },
          },
        },
      }
      const req = baseReq(data)
      await controllers.checkIns.postViewCheckIn(hmppsAuthClient)(req, res)

      expect(postReviewNoteSpy).toHaveBeenCalled()
      expect(getProbationPractitionerSpy).toHaveBeenCalled()
      expect(redirectSpy).toHaveBeenCalledWith(req.url)
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postViewCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.postViewCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
    it('returns 404 when id and crn are invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.postViewCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('postReviewCheckIn', () => {
    it('redirect to activity log page', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postReviewCheckIn(hmppsAuthClient)(req, res)

      expect(postReviewSpy).toHaveBeenCalled()
      expect(getProbationPractitionerSpy).toHaveBeenCalled()
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${req.params.crn}/activity-log`)
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postReviewCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.postReviewCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
    it('returns 404 when id and crn are invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.postReviewCheckIn(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('getManageCheckinPage', () => {
    it('returns 404 when CRN or id invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getManageCheckinPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('fetch personal details and renders mange-checkin page', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      // Arrange personal details returned by MAS
      ;(mockPersonalDetails as PersonalDetails).mobileNumber = '07700900000'
      ;(mockPersonalDetails as PersonalDetails).email = 'test@example.com'

      const req = baseReq()
      await controllers.checkIns.getManageCheckinPage(hmppsAuthClient)(req, res)

      // token retrieval and MAS client call
      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('testuser')
      expect(getPersonalDetailsSpy).toHaveBeenCalledWith(crn)
      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/manage/manage-checkin.njk', {
        crn,
        mobile: '07700900000',
        id: uuid,
        email: 'test@example.com',
        showChange: false,
      })
    })

    it('note when changes have occured', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const data = {
        esupervision: {
          [crn]: {
            [uuid]: {
              manageCheckin: {
                checkInMobile: '07700900011',
                checkInEmail: 'user@example.com',
                settingsUpdated: true,
              },
            },
          },
        },
      }

      const req = baseReq(data)
      await controllers.checkIns.getManageCheckinPage(hmppsAuthClient)(req, res)

      expect(res.locals.success).toEqual(true)
    })
  })

  describe('getManageCheckinDatePage', () => {
    it('returns 404 when CRN or id invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      const req = baseReq()

      await controllers.checkIns.getManageCheckinDatePage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('sets session values from response and renders settings with min date', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)
      ;(res.locals as any).offenderCheckinsByCRNResponse = {
        firstCheckin: '01/01/2026',
        checkinInterval: 'WEEKLY',
      }
      const req = baseReq({})

      await controllers.checkIns.getManageCheckinDatePage(hmppsAuthClient)(req, res)
      expect(mockSetDataValue).toHaveBeenCalledWith(req.session.data, ['esupervision', crn, uuid, 'manageCheckin'], {
        date: '01/01/2026',
        interval: 'WEEKLY',
      })
      expect(renderSpy).toHaveBeenCalledWith(
        'pages/check-in/manage/checkin-settings.njk',
        expect.objectContaining({
          crn,
          id: uuid,
        }),
      )

      const locals = (renderSpy.mock.calls[renderSpy.mock.calls.length - 1] as any)[1]
      expect(locals.checkInMinDate).toBeDefined()
    })
  })

  describe('postManageCheckinDatePage', () => {
    it('returns 404 when CRN or id invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      const req = baseReq()

      await controllers.checkIns.postManageCheckinDatePage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('redirects to manage page', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postManageCheckinDatePage(hmppsAuthClient)(req, res)

      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/check-in/manage/${uuid}`)
    })

    it('sets settings updated to true if response has crn', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq({})
      postUpdateOffenderDetailsSpy.mockImplementationOnce(() => Promise.resolve({ crn } as CheckinScheduleResponse))
      await controllers.checkIns.postManageCheckinDatePage(hmppsAuthClient)(req, res)

      expect(res.locals.success).toEqual(true)
    })
  })

  describe('getManageContactPage', () => {
    it('returns 404 when CRN or id invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      const req = baseReq()

      await controllers.checkIns.getManageContactPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('reads contact info from session and renders', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const data = {
        esupervision: {
          [crn]: {
            [uuid]: {
              manageCheckin: {
                checkInMobile: '07700900011',
                checkInEmail: 'user@example.com',
              },
            },
          },
        },
      }
      const req = baseReq(data)

      await controllers.checkIns.getManageContactPage(hmppsAuthClient)(req, res)

      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/manage/manage-contact.njk', {
        crn,
        id: uuid,
        checkInMobile: '07700900011',
        checkInEmail: 'user@example.com',
      })
    })

    it('shows success message when contactUpdated flag set and clears it', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const data: any = {
        esupervision: {
          [crn]: {
            [uuid]: {
              manageCheckin: {
                checkInMobile: '07700900011',
                checkInEmail: 'user@example.com',
                contactUpdated: true,
              },
            },
          },
        },
      }
      const mockRes = mockAppResponse()
      const req = baseReq(data)

      await controllers.checkIns.getManageContactPage(hmppsAuthClient)(req, mockRes)

      expect(mockRes.locals.success).toBe(true)
      // contactUpdated flag should be removed
      expect(req.session?.data?.esupervision?.[crn]?.[uuid]?.manageCheckin?.contactUpdated).toBeUndefined()
    })
  })

  describe('postManageContactPage', () => {
    it('returns 404 when CRN or id invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      const req = baseReq()

      await controllers.checkIns.postManageContactPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('stores edit values in session and redirects to edit-contact when change is email', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const data = {
        esupervision: {
          [crn]: {
            [uuid]: {
              manageCheckin: {
                checkInMobile: '07700900022',
                checkInEmail: 'edit@example.com',
              },
            },
          },
        },
      }
      const req = baseReq(data)
      req.body = { change: 'email' }

      await controllers.checkIns.postManageContactPage(hmppsAuthClient)(req, res)

      expect(mockSetDataValue).toHaveBeenCalledWith(
        req.session.data,
        ['esupervision', crn, uuid, 'manageCheckin', 'editCheckInMobile'],
        '07700900022',
      )
      expect(mockSetDataValue).toHaveBeenCalledWith(
        req.session.data,
        ['esupervision', crn, uuid, 'manageCheckin', 'editCheckInEmail'],
        'edit@example.com',
      )
      expect(redirectSpy).toHaveBeenCalledWith(
        `/case/${crn}/appointments/check-in/manage/${uuid}/edit-contact?change=email`,
      )
    })

    it('redirects to main manage page when change is main', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const data = {
        esupervision: {
          [crn]: {
            [uuid]: {
              manageCheckin: {
                checkInMobile: '07700900022',
                checkInEmail: 'edit@example.com',
              },
            },
          },
        },
      }
      const req = baseReq(data)
      req.body = { change: 'main' }

      await controllers.checkIns.postManageContactPage(hmppsAuthClient)(req, res)

      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/check-in/manage/${uuid}`)
    })

    it('sets settings updated to true if response has crn', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq({})
      req.body = { change: 'main' }
      postUpdateOffenderDetailsSpy.mockImplementationOnce(() => Promise.resolve({ crn } as CheckinScheduleResponse))
      await controllers.checkIns.postManageContactPage(hmppsAuthClient)(req, res)

      expect(res.locals.success).toEqual(true)
    })
  })

  describe('getManageEditContactPage', () => {
    it('returns 404 when CRN or id invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      const req = baseReq()

      await controllers.checkIns.getManageEditContactPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('renders edit-contact with values and change query', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const data = {
        esupervision: {
          [crn]: {
            [uuid]: {
              manageCheckin: {
                editCheckInMobile: '07700900033',
                editCheckInEmail: 'edited@example.com',
                contactUpdated: true,
              },
            },
          },
        },
      }
      const req = baseReq(data)
      req.query = { change: 'email' }

      await controllers.checkIns.getManageEditContactPage(hmppsAuthClient)(req, res)

      expect(res.locals.success).toBe(true)
      expect(
        req.session.data?.esupervision?.[crn]?.[uuid]?.manageCheckin?.contactUpdated as unknown as boolean | undefined,
      ).toBeUndefined()

      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/manage/manage-edit-contact.njk', {
        crn,
        id: uuid,
        change: 'email',
        checkInMobile: '07700900033',
        checkInEmail: 'edited@example.com',
      })
    })

    it('renders edit-contact where no contact updated value', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const resSpecific = mockAppResponse({ success: false })

      const data = {
        esupervision: {
          [crn]: {
            [uuid]: {
              manageCheckin: {
                editCheckInMobile: '07700900033',
                editCheckInEmail: 'edited@example.com',
              },
            },
          },
        },
      }
      const req = baseReq(data)
      req.query = { change: 'email' }

      await controllers.checkIns.getManageEditContactPage(hmppsAuthClient)(req, resSpecific)

      expect(resSpecific.locals.success).toBe(false)
    })
  })

  describe('postManageEditContactPage', () => {
    it('returns 404 when CRN or id invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      const req = baseReq()

      await controllers.checkIns.postManageEditContactPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('redirects to contact page without API call when no changes', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const data = {
        esupervision: {
          [crn]: {
            [uuid]: {
              manageCheckin: {
                editCheckInMobile: '07700900044',
                editCheckInEmail: 'same@example.com',
              },
            },
          },
        },
      }
      const req = baseReq(data)
      req.body = { previousMobile: '07700900044', previousEmail: 'same@example.com' }

      await controllers.checkIns.postManageEditContactPage(hmppsAuthClient)(req, res)

      expect(updatePersonalDetailsSpy).not.toHaveBeenCalled()
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/check-in/manage/${uuid}/contact`)
    })

    it('updates MAS when values changed, sets flags and redirects', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const data: any = {
        esupervision: {
          [crn]: {
            [uuid]: {
              manageCheckin: {
                editCheckInMobile: ' 07700900055     ',
                editCheckInEmail: 'new@example.com',
                checkInMobile: 'oldmobile',
                checkInEmail: 'old@example.com',
              },
            },
          },
        },
      }
      const req = baseReq(data)
      req.body = { previousMobile: '07700900044', previousEmail: 'same@example.com' }

      await controllers.checkIns.postManageEditContactPage(hmppsAuthClient)(req, res)

      // token and update called
      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('testuser')
      expect(updatePersonalDetailsSpy).toHaveBeenCalledWith(crn, {
        emailAddress: 'new@example.com',
        mobileNumber: '07700900055',
      })

      // flags and values updated in session
      expect(mockSetDataValue).toHaveBeenCalledWith(
        req.session.data,
        ['esupervision', crn, uuid, 'manageCheckin', 'contactUpdated'],
        true,
      )
      expect(mockSetDataValue).toHaveBeenCalledWith(
        req.session.data,
        ['esupervision', crn, uuid, 'manageCheckin', 'checkInMobile'],
        '07700900055',
      )
      expect(mockSetDataValue).toHaveBeenCalledWith(
        req.session.data,
        ['esupervision', crn, uuid, 'manageCheckin', 'checkInEmail'],
        'new@example.com',
      )

      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/check-in/manage/${uuid}/contact`)
    })
  })

  describe('getStopCheckinPage', () => {
    it('renders stop-check in page', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)
      const req = httpMocks.createRequest({
        params: { crn, id: uuid },
      })

      await controllers.checkIns.getStopCheckinPage(hmppsAuthClient)(req, res)

      expect(renderSpy).toHaveBeenCalled()
      const [template, context] = (renderSpy as jest.Mock).mock.calls.pop()
      expect(template).toBe('pages/check-in/manage/stop-checkin.njk')
      expect(context.crn).toBe(crn)
      expect(context.id).toBe(uuid)
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getStopCheckinPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getStopCheckinPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('postManageStopCheckin', () => {
    it('returns 404 when CRN or id invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      const req = baseReq()

      await controllers.checkIns.postManageStopCheckin(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('redirects to manage page', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postManageStopCheckin(hmppsAuthClient)(req, res)

      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/check-in/manage/${uuid}`)
    })

    it('updates MAS when values changed, sets flags and redirects', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const data: any = {
        esupervision: {
          [crn]: {
            [uuid]: {
              manageCheckin: {
                stopCheckin: 'YES',
                reason: 'Reason for stopping check in',
              },
            },
          },
        },
      }
      const req = baseReq(data)
      await controllers.checkIns.postManageStopCheckin(hmppsAuthClient)(req, res)

      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('testuser')
      expect(postDeactivateOffender).toHaveBeenCalledWith(uuid, {
        requestedBy: 'testuser',
        reason: 'Reason for stopping check in',
      })
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/check-in/manage/${uuid}`)
    })
  })

  describe('getCheckinVideoPage', () => {
    it('renders video in page', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)
      const req = httpMocks.createRequest({
        params: { crn, id: uuid },
      })

      await controllers.checkIns.getCheckinVideoPage(hmppsAuthClient)(req, res)

      expect(renderSpy).toHaveBeenCalled()
      const [template, context] = (renderSpy as jest.Mock).mock.calls.pop()
      expect(template).toBe('pages/check-in/video.njk')
      expect(context.crn).toBe(crn)
      expect(context.id).toBe(uuid)
    })

    it('returns 404 when CRN and uuid is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getCheckinVideoPage(hmppsAuthClient)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })
})
