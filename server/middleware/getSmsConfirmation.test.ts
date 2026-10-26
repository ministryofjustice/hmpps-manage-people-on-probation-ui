import httpMocks from 'node-mocks-http'
import { getSmsConfirmation } from './getSmsConfirmation'
import { getSmsPreview } from './getSmsPreview'
import { Option } from '../models/Option'
import { AppResponse, SmsConfirmation } from '../models/Locals'
import { mockAppResponse } from '../controllers/mocks'
import MasApiClient from '../data/masApiClient'
import { ErrorSummary } from '../data/model/common'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { LastSmsStatusResponse, SmsPreviewResponse } from '../data/model/OutlookEvent'
import { PersonalDetailsUpdatedResponse } from '../data/model/personalDetails'
import SupervisionAppointmentClient from '../data/SupervisionAppointmentClient'

const crn = 'X000001'

const mockOptions: Option[] = [
  { text: 'Yes', value: 'YES' },
  { text: 'Yes, update their mobile number', value: 'YES_UPDATE_MOBILE_NUMBER' },
  { text: 'No', value: 'NO' },
]

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

jest.mock('./getSmsConfirmationOptions', () => ({
  getSmsConfirmationOptions: jest.fn(() => jest.fn().mockReturnValue(mockOptions)),
}))

jest.mock('./getSmsPreview', () => ({
  getSmsPreview: jest.fn(() => jest.fn()),
}))

const hmppsAuthClient = new HmppsAuthClient(tokenStore)
const getSmsPreviewSpy = getSmsPreview as jest.MockedFunction<typeof getSmsPreview>
const nextSpy = jest.fn()

const buildRequest = (): httpMocks.MockRequest<any> => {
  const req = {
    params: {
      crn,
    },
  }
  return httpMocks.createRequest(req)
}

const buildResponse = ({ enableAllowSms = true, enableLastTextMessage = true } = {}): AppResponse => {
  const locals = {
    flags: {
      enableAllowSms,
      enableLastTextMessage,
    },
  }
  return mockAppResponse(locals)
}

const mockErrorSummary: ErrorSummary = {
  errors: [{ text: 'Error message' }],
}

const mockPreview: SmsPreviewResponse = {
  englishSmsPreview:
    'Dear Stuart,\n\nYou have an appointment at Leamington Probation Office on Monday 11 August at 2pm.\n\nThis is an automated message. Do not reply.',
  welshSmsPreview: null,
}

const mockPersonalDetailsUpdated: PersonalDetailsUpdatedResponse = {
  username: 'terry-jones',
  name: {
    forename: 'Terry',
    middleName: '',
    surname: 'Jones',
  },
  updatedDateTime: '2025-10-16T14:55:23.537Z',
}

const getLastSmsStatus = ({
  notificationId = 'notification-id',
  sentAt = '2025-10-16T14:55:23.537Z',
  status = 'delivered',
  statusUpdatedAt = '2025-10-17T14:55:23.537Z',
}: Partial<LastSmsStatusResponse> = {}): LastSmsStatusResponse => ({
  notificationId,
  sentAt,
  status,
  statusUpdatedAt,
})

describe('middleware/getSmsConfirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('enableAllowSms feature flag enabled', () => {
    describe('enableLastTextMessage feature flag disabled', () => {
      const res = buildResponse({ enableLastTextMessage: false })
      it('should return the correct overview if personal details update api request returns a 500 error', async () => {
        jest.spyOn(MasApiClient.prototype, 'getPersonalDetailsUpdated').mockResolvedValueOnce(mockErrorSummary)
        const getLastSmsStatusSpy = jest.spyOn(SupervisionAppointmentClient.prototype, 'getLatestSmsStatusByCrn')
        const req = buildRequest()
        getSmsPreviewSpy.mockImplementationOnce(() => () => Promise.resolve(mockPreview))

        const expected: SmsConfirmation = {
          overview: [],
          options: mockOptions,
          preview: mockPreview,
          errors: null,
        }
        await getSmsConfirmation(hmppsAuthClient)(req, res, nextSpy)
        expect(getLastSmsStatusSpy).not.toHaveBeenCalled()
        expect(res.locals.smsConfirmation).toStrictEqual(expected)
        expect(nextSpy).toHaveBeenCalledWith()
      })
      it('should return the correct overview', async () => {
        jest
          .spyOn(MasApiClient.prototype, 'getPersonalDetailsUpdated')
          .mockResolvedValueOnce(mockPersonalDetailsUpdated)
        const getLatestSmsStatusSpy = jest.spyOn(SupervisionAppointmentClient.prototype, 'getLatestSmsStatusByCrn')
        const req = buildRequest()
        getSmsPreviewSpy.mockImplementationOnce(() => () => Promise.resolve(mockPreview))
        await getSmsConfirmation(hmppsAuthClient)(req, res, nextSpy)
        const expected: SmsConfirmation = {
          overview: ['Personal details last updated: 16 October 2025 by Terry Jones'],
          options: mockOptions,
          preview: mockPreview,
          errors: null,
        }
        expect(getLatestSmsStatusSpy).not.toHaveBeenCalled()
        expect(res.locals.smsConfirmation).toStrictEqual(expected)
        expect(nextSpy).toHaveBeenCalledWith()
      })
    })
    describe('enableLastTextMessage feature flag enabled', () => {
      const res = buildResponse()
      it('should return the correct overview if personal details update api request returns a 500 error', async () => {
        jest.spyOn(MasApiClient.prototype, 'getPersonalDetailsUpdated').mockResolvedValueOnce(mockErrorSummary)
        jest
          .spyOn(SupervisionAppointmentClient.prototype, 'getLatestSmsStatusByCrn')
          .mockResolvedValueOnce(getLastSmsStatus())
        const req = buildRequest()
        getSmsPreviewSpy.mockImplementationOnce(() => () => Promise.resolve(mockPreview))
        const expected: SmsConfirmation = {
          overview: ['Last text message: delivered on 17 October 2025'],
          options: mockOptions,
          preview: mockPreview,
          errors: null,
        }
        await getSmsConfirmation(hmppsAuthClient)(req, res, nextSpy)
        expect(res.locals.smsConfirmation).toStrictEqual(expected)
        expect(nextSpy).toHaveBeenCalledWith()
      })
      it('should return the correct overview if last sms api request returns a 500 error', async () => {
        jest
          .spyOn(MasApiClient.prototype, 'getPersonalDetailsUpdated')
          .mockResolvedValueOnce(mockPersonalDetailsUpdated)
        jest
          .spyOn(SupervisionAppointmentClient.prototype, 'getLatestSmsStatusByCrn')
          .mockResolvedValueOnce(mockErrorSummary)
        const req = buildRequest()
        getSmsPreviewSpy.mockImplementationOnce(() => () => Promise.resolve(mockPreview))
        const expected: SmsConfirmation = {
          overview: ['Personal details last updated: 16 October 2025 by Terry Jones'],
          options: mockOptions,
          preview: mockPreview,
          errors: null,
        }
        await getSmsConfirmation(hmppsAuthClient)(req, res, nextSpy)
        expect(res.locals.smsConfirmation).toStrictEqual(expected)
        expect(nextSpy).toHaveBeenCalledWith()
      })
      it('should return the correct overview if last sms was delivered', async () => {
        jest
          .spyOn(MasApiClient.prototype, 'getPersonalDetailsUpdated')
          .mockResolvedValueOnce(mockPersonalDetailsUpdated)
        jest
          .spyOn(SupervisionAppointmentClient.prototype, 'getLatestSmsStatusByCrn')
          .mockResolvedValueOnce(getLastSmsStatus())
        const req = buildRequest()
        getSmsPreviewSpy.mockImplementationOnce(() => () => Promise.resolve(mockPreview))
        await getSmsConfirmation(hmppsAuthClient)(req, res, nextSpy)
        const expected: SmsConfirmation = {
          overview: [
            'Personal details last updated: 16 October 2025 by Terry Jones',
            'Last text message: delivered on 17 October 2025',
          ],
          options: mockOptions,
          preview: mockPreview,
          errors: null,
        }
        expect(res.locals.smsConfirmation).toStrictEqual(expected)
        expect(nextSpy).toHaveBeenCalledWith()
      })
      it('should return the correct overview if last sms was sent, but not delivered', async () => {
        jest
          .spyOn(MasApiClient.prototype, 'getPersonalDetailsUpdated')
          .mockResolvedValueOnce(mockPersonalDetailsUpdated)
        jest
          .spyOn(SupervisionAppointmentClient.prototype, 'getLatestSmsStatusByCrn')
          .mockResolvedValueOnce(getLastSmsStatus({ status: 'permanent-failure' }))
        const req = buildRequest()
        getSmsPreviewSpy.mockImplementationOnce(() => () => Promise.resolve(mockPreview))
        await getSmsConfirmation(hmppsAuthClient)(req, res, nextSpy)
        expect(res.locals.smsConfirmation.overview).toContain(
          'Last text message: sent on 16 October 2025 but could not be delivered',
        )
        expect(nextSpy).toHaveBeenCalledWith()
      })

      it('should show delivery status unavailable when the last SMS status is null', async () => {
        jest
          .spyOn(MasApiClient.prototype, 'getPersonalDetailsUpdated')
          .mockResolvedValueOnce(mockPersonalDetailsUpdated)
        jest
          .spyOn(SupervisionAppointmentClient.prototype, 'getLatestSmsStatusByCrn')
          .mockResolvedValueOnce(getLastSmsStatus({ status: null }))

        const req = buildRequest()
        getSmsPreviewSpy.mockImplementationOnce(() => () => Promise.resolve(mockPreview))

        await getSmsConfirmation(hmppsAuthClient)(req, res, nextSpy)

        expect(res.locals.smsConfirmation.overview).toContain(
          'Last text message: sent on 16 October 2025 — delivery status unavailable',
        )
        expect(nextSpy).toHaveBeenCalledWith()
      })

      it('should return the correct overview if no sms sent in last 90 days', async () => {
        jest
          .spyOn(MasApiClient.prototype, 'getPersonalDetailsUpdated')
          .mockResolvedValueOnce(mockPersonalDetailsUpdated)
        jest.spyOn(SupervisionAppointmentClient.prototype, 'getLatestSmsStatusByCrn').mockResolvedValueOnce(null)

        const req = buildRequest()
        getSmsPreviewSpy.mockImplementationOnce(() => () => Promise.resolve(mockPreview))
        await getSmsConfirmation(hmppsAuthClient)(req, res, nextSpy)
        expect(res.locals.smsConfirmation.overview).toContain('Last text message: none sent in the last 90 days')
        expect(nextSpy).toHaveBeenCalledWith()
      })
      it('should return the correct overview if sms sent but is pending delivery', async () => {
        jest
          .spyOn(MasApiClient.prototype, 'getPersonalDetailsUpdated')
          .mockResolvedValueOnce(mockPersonalDetailsUpdated)
        jest
          .spyOn(SupervisionAppointmentClient.prototype, 'getLatestSmsStatusByCrn')
          .mockResolvedValueOnce(getLastSmsStatus({ status: 'sending' }))
        const req = buildRequest()
        getSmsPreviewSpy.mockImplementationOnce(() => () => Promise.resolve(mockPreview))
        await getSmsConfirmation(hmppsAuthClient)(req, res, nextSpy)
        expect(res.locals.smsConfirmation.overview).toContain(
          'Last text message: sent on 16 October 2025 and attempting delivery until 19 October 2025',
        )
        expect(nextSpy).toHaveBeenCalledWith()
      })
    })

    it('should return the correct overview if sms preview returns a 500 error', async () => {
      jest.spyOn(MasApiClient.prototype, 'getPersonalDetailsUpdated').mockResolvedValueOnce(mockPersonalDetailsUpdated)
      jest
        .spyOn(SupervisionAppointmentClient.prototype, 'getLatestSmsStatusByCrn')
        .mockResolvedValueOnce(getLastSmsStatus())
      getSmsPreviewSpy.mockImplementation(() => () => Promise.resolve(mockErrorSummary))
      const req = buildRequest()
      const res = buildResponse()
      await getSmsConfirmation(hmppsAuthClient)(req, res, nextSpy)
      expect(res.locals.smsConfirmation.preview).toBeNull()
      expect(res.locals.smsConfirmation.errors).toStrictEqual([{ text: 'Error message' }])
      expect(nextSpy).toHaveBeenCalledWith()
    })
  })
})
