import httpMocks from 'node-mocks-http'
import controllers from '.'
import { mockAppResponse } from './mocks'
import { isValidCrn, isValidUUID, setDataValue } from '../utils'
import { renderError } from '../middleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import { PersonalDetails } from '../data/model/personalDetails'
import { defaultUser } from './mocks/alerts'

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
    it('renders contact preference page when CRN and id are valid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.getContactPreferencePage(hmppsAuthClient)(req, res)

      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/contact-preference.njk', {
        crn,
        id: uuid,
      })
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

  describe('postPhotoRulesPage', () => {
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
})
