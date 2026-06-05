import httpMocks from 'node-mocks-http'
import { handlePutOutcome } from './handlePutOutcome'
import { mockAppResponse } from '../../controllers/mocks'
import { AppointmentSession, AppointmentSessionOutcome } from '../../models/Appointments'
import { renderError } from '../renderError'
import { HmppsAuthClient } from '../../data'
import { findUncompleted } from '../findUncompleted'
import MasApiClient from '../../data/masApiClient'
import { PutContactRequest } from '../../data/model/schedule'
import TokenStore from '../../data/tokenStore/redisTokenStore'
import { AppointmentOutcomeProps } from '../../models/Locals'

const id = '304bddc2-cfa5-4a33-92e2-ee31fc93d627'
const contactId = '1234'
const crn = 'X000001'
const baseOutcomeUrl = '/base-outcome-url'
const notePrepend = 'Prepend text'
const notes = 'Some notes'

const mockMiddlewareFn = jest.fn()
jest.mock('../renderError', () => ({
  renderError: jest.fn(() => mockMiddlewareFn),
}))

jest.mock('../../utils', () => {
  const actualUtils = jest.requireActual('../../utils')
  return {
    ...actualUtils,
    setDataValue: jest.fn(),
  }
})

jest.mock('../findUncompleted', () => ({
  findUncompleted: jest.fn(() => jest.fn()),
}))

jest.mock('../../data/tokenStore/redisTokenStore')

jest.mock('../../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})

const mockRenderError = renderError as jest.MockedFunction<typeof renderError>

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

const findUncompletedSpy = findUncompleted as jest.MockedFunction<typeof findUncompleted>
const putContactSpy = jest.spyOn(MasApiClient.prototype, 'putContact').mockResolvedValue({} as any)

const mockAppointment = ({
  appointment = {},
  outcome = {},
}: {
  appointment?: Partial<AppointmentSession>
  outcome?: Partial<AppointmentSessionOutcome>
} = {}): AppointmentSession => ({
  user: {
    username: 'user-1',
    teamCode: 'mock-team-code',
    locationCode: 'mock-location-code',
  },
  eventId: '1',
  type: 'C084',
  date: '2044-12-22T09:15:00.382936Z[Europe/London]',
  start: '2044-12-22T09:15:00.382936Z[Europe/London]',
  end: '2044-12-22T09:15:00.382936Z[Europe/London]',
  sensitivity: 'Yes',
  outcomeRecorded: 'Yes',
  smsOptIn: 'YES',
  sensitivityLocked: true,
  rescheduleAppointment: {},
  outcome: {
    outcomeType: 'ATTENDED_COMPLIED',
    outcomeCode: 'ATTC',
    ...outcome,
  },
  ...appointment,
})

const buildRequest = (): httpMocks.MockRequest<any> => {
  const req = {
    params: { id, contactId, crn },
  }
  return httpMocks.createRequest(req)
}

const buildResponse = ({
  appointment,
  outcome,
  isValidParams = true,
  appointmentOutcome = {},
}: {
  appointment?: Partial<AppointmentSession>
  outcome?: Partial<AppointmentSessionOutcome>
  appointmentOutcome?: Partial<AppointmentOutcomeProps<any>>
  isValidParams?: boolean
} = {}): httpMocks.MockRequest<any> => {
  const locals = {
    flags: {
      enableNonCompliance: true,
    },
    appointmentOutcome: {
      crn,
      id,
      contactId,
      appointmentSession: mockAppointment({ appointment, outcome }),
      notePrepend,
      baseOutcomeUrl,
      isValidParams,
      ...appointmentOutcome,
    },
  }
  return mockAppResponse(locals)
}

const nextSpy = jest.fn()

describe('middleware/appointment-outcomes/handlePutOutcome', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should only call next() if arranged appointment is in the future', async () => {
    const appointmentOutcome: Partial<AppointmentOutcomeProps<any>> = { responseContactId: '1234', isInPast: false }
    const req = buildRequest()
    const res = buildResponse({ appointmentOutcome })
    await handlePutOutcome(hmppsAuthClient)(req, res, nextSpy)
    expect(putContactSpy).not.toHaveBeenCalled()
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should only call next() if manage appointment but contactId is undefined', async () => {
    const appointmentOutcome: Partial<AppointmentOutcomeProps<any>> = { contactId: undefined }
    const req = buildRequest()
    const res = buildResponse({ appointmentOutcome })
    await handlePutOutcome(hmppsAuthClient)(req, res, nextSpy)
    expect(putContactSpy).not.toHaveBeenCalled()
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should return a 400 error if invalid crn', async () => {
    const req = buildRequest()
    const res = buildResponse({ isValidParams: false })
    await handlePutOutcome(hmppsAuthClient)(req, res, nextSpy)
    expect(mockRenderError).toHaveBeenCalledWith(404)
    expect(nextSpy).not.toHaveBeenCalledTimes(1)
  })

  it('should return a 400 error if invalid UUID', async () => {
    const req = buildRequest()
    const res = buildResponse({ isValidParams: false })
    await handlePutOutcome(hmppsAuthClient)(req, res, nextSpy)
    expect(mockRenderError).toHaveBeenCalledWith(404)
    expect(nextSpy).not.toHaveBeenCalledTimes(1)
  })

  it('should redirect to the outcome page if selected outcome requires an enforcement action but none selected', async () => {
    const outcome: Partial<AppointmentSessionOutcome> = { outcomeType: 'ATTENDED_FAILED_TO_COMPLY' }
    const req = buildRequest()
    const res = buildResponse({ outcome })
    await handlePutOutcome(hmppsAuthClient)(req, res, nextSpy)
    expect(res.redirect).toHaveBeenCalledWith(`${baseOutcomeUrl}?validation=true`)
  })

  it('should redirect to the outcome page if in manage journey and outcome is not completed', async () => {
    const outcome: Partial<AppointmentSessionOutcome> = { outcomeType: null }
    const req = buildRequest()
    const res = buildResponse({ outcome })
    const uncompletedUrl = `/case/${crn}/uncompleted-page?change=/change/url`
    findUncompletedSpy.mockReturnValueOnce(() => uncompletedUrl)
    await handlePutOutcome(hmppsAuthClient)(req, res, nextSpy)
    expect(res.redirect).toHaveBeenCalledWith(`${uncompletedUrl}`)
  })

  it('should put the correct request to the API if no notes and no enforcement action codes selected', async () => {
    const req = buildRequest()
    const res = buildResponse()
    await handlePutOutcome(hmppsAuthClient)(req, res, nextSpy)
    const {
      date,
      start,
      outcome: { outcomeCode },
    } = mockAppointment()
    const expectedRequest: PutContactRequest = {
      date,
      time: start,
      outcomeCode,
      alert: true,
      notes: '',
      sensitive: true,
    }
    expect(putContactSpy).toHaveBeenCalledWith(contactId, expectedRequest)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })

  it('should put the correct request to the API if notePrepend value exists and a single enforcement action is selected', async () => {
    const appointment: Partial<AppointmentSession> = { notes }
    const outcome: Partial<AppointmentSessionOutcome> = {
      outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
      outcomeCode: 'AFTC',
      attendedFailedToComply: 'BREACH_RECALL_INITIATED',
      enforcementActionCode: ['IBR'],
    }
    const req = buildRequest()
    const res = buildResponse({ appointment, outcome })
    await handlePutOutcome(hmppsAuthClient)(req, res, nextSpy)
    const {
      date,
      start,
      outcome: { outcomeCode },
    } = mockAppointment()
    const expectedRequest: PutContactRequest = {
      date,
      time: start,
      outcomeCode: outcome.outcomeCode,
      enforcementActionCode: 'IBR',
      notes: `${notePrepend}\n${notes}`,
      alert: true,
      sensitive: true,
    }
    expect(putContactSpy).toHaveBeenCalledWith(contactId, expectedRequest)
    expect(putContactSpy).toHaveBeenCalledTimes(1)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })

  it('should send multiple requests to the API if two enforcement actions are selected', async () => {
    const appointment: Partial<AppointmentSession> = { notes }
    const outcome: Partial<AppointmentSessionOutcome> = {
      outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
      outcomeCode: 'AFTC',
      attendedFailedToComply: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      enforcementActionCode: ['IBR', 'LCL'],
    }
    const req = buildRequest()
    const res = buildResponse({ appointment, outcome })
    await handlePutOutcome(hmppsAuthClient)(req, res, nextSpy)
    const {
      date,
      start,
      outcome: { outcomeCode },
    } = mockAppointment()
    const expectedRequests: PutContactRequest[] = [
      {
        date,
        time: start,
        outcomeCode: outcome.outcomeCode,
        enforcementActionCode: 'IBR',
        notes: `${notePrepend}\n${notes}`,
        alert: true,
        sensitive: true,
      },
      {
        date,
        time: start,
        outcomeCode: outcome.outcomeCode,
        enforcementActionCode: 'LCL',
        notes: `${notePrepend}\n${notes}`,
        alert: true,
        sensitive: true,
      },
    ]
    expect(putContactSpy).toHaveBeenNthCalledWith(1, contactId, expectedRequests[0])
    expect(putContactSpy).toHaveBeenNthCalledWith(2, contactId, expectedRequests[1])
    expect(putContactSpy).toHaveBeenCalledTimes(2)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
