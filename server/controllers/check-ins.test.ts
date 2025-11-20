import httpMocks from 'node-mocks-http'
import controllers from '.'
import { mockAppResponse } from './mocks'
import { isValidCrn, isValidUUID } from '../utils'
import { renderError } from '../middleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import { PersonalDetails } from '../data/model/personalDetails'

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
      await controllers.checkIns.getIntroPage(null as any)(req, res)

      expect(renderSpy).toHaveBeenCalledWith('pages/check-in/instructions.njk', { crn })
      expect(mockRenderError).not.toHaveBeenCalled()
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getIntroPage(null as any)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('postIntroPage', () => {
    it('redirects to date-frequency with generated id when CRN is valid', async () => {
      mockIsValidCrn.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postIntroPage(null as any)(req, res)

      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/${uuid}/check-in/date-frequency`)
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.postIntroPage(null as any)(req, res)

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
      await controllers.checkIns.getDateFrequencyPage(null as any)(req, res)

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
      await controllers.checkIns.getDateFrequencyPage(null as any)(req, res)

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
      await controllers.checkIns.getDateFrequencyPage(null as any)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getDateFrequencyPage(null as any)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('postDateFrequencyPage', () => {
    it('redirects to contact-preference when CRN and id are valid', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postDateFrequencyPage(null as any)(req, res)

      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/${uuid}/check-in/contact-preference`)
    })

    it('returns 404 when CRN is invalid', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsValidUUID.mockReturnValue(true)

      const req = baseReq()
      await controllers.checkIns.postDateFrequencyPage(null as any)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.postDateFrequencyPage(null as any)(req, res)

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
      await controllers.checkIns.getContactPreferencePage(null as any)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('returns 404 when id is not a valid UUID', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsValidUUID.mockReturnValue(false)

      const req = baseReq()
      await controllers.checkIns.getContactPreferencePage(null as any)(req, res)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })
})
