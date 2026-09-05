import httpMocks from 'node-mocks-http'
import { AppointmentSession } from '../models/Appointments'
import { findUncompleted } from './findUncompleted'
import { appointmentDateIsInPast } from './appointmentDateIsInPast'
import { Name } from '../data/model/personalDetails'
import { mockAppResponse } from '../controllers/mocks'

const crn = 'X000001'
const id = '1'
const change = 'changeUrl'

jest.mock('./appointmentDateIsInPast', () => ({
  appointmentDateIsInPast: jest.fn(),
}))

const mockAppointmentSession: AppointmentSession = {
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
}

const mockAppointmentDateIsInPast = appointmentDateIsInPast as jest.MockedFunction<typeof appointmentDateIsInPast>

mockAppointmentDateIsInPast.mockImplementation(() => false)

const buildRequest = (
  session?: Record<string, string | Record<string, string | Name>>,
  _nextAppointmentId: string | null = null,
): httpMocks.MockRequest<any> => {
  const req = {
    params: {
      crn,
      id,
    },
    query: {
      change,
    },
    session: {
      data: {
        appointments: {
          [crn]: {
            [id]: {
              ...mockAppointmentSession,
              ...(session || {}),
            },
          },
        },
        temp: {
          [crn]: {
            nextAppointmentId: _nextAppointmentId,
          },
        },
      },
    },
  }
  return httpMocks.createRequest(req)
}

const buildResponse = (locals: Record<string, any>) => mockAppResponse(locals)

const res = buildResponse({
  flags: {
    enableNonCompliance: true,
    enableCombinedCYAPage: true,
  },
})

describe('middleware/findUncompleted', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should return change url if all required appointment data provided', () => {
    const req = buildRequest()
    expect(findUncompleted()(req, res)).toBe(change)
  })
  it('should return change url if nextAppointmentId is available and all required appointment data provided', () => {
    const req = buildRequest({}, id)
    expect(findUncompleted()(req, res)).toBe(change)
  })
  it('should return sentence url if no eventId', () => {
    const req = buildRequest({ eventId: null })
    expect(findUncompleted()(req, res)).toBe(`/case/${crn}/arrange-appointment/${id}/sentence?change=${change}`)
  })
  it('should return sentence url and force validation if no eventId', () => {
    const req = buildRequest({ eventId: null })
    expect(findUncompleted({ forceValidation: true })(req, res)).toBe(
      `/case/${crn}/arrange-appointment/${id}/sentence?change=${change}&validation=true`,
    )
  })
  it('should return type url if no type (and previous conditions not met)', () => {
    const req = buildRequest({ type: null })
    expect(findUncompleted()(req, res)).toBe(`/case/${crn}/arrange-appointment/${id}/type-attendance?change=${change}`)
  })
  it('should return attendance url if no user info (and previous conditions not met)', () => {
    const req = buildRequest({
      user: {
        ...mockAppointmentSession.user,
        username: null,
      },
    })
    expect(findUncompleted()(req, res)).toBe(`/case/${crn}/arrange-appointment/${id}/attendance?change=${change}`)
  })
  it('should return location url if no location (and previous conditions not met)', () => {
    const req = buildRequest({
      user: {
        ...mockAppointmentSession.user,
        locationCode: null,
      },
    })
    expect(findUncompleted()(req, res)).toBe(
      `/case/${crn}/arrange-appointment/${id}/location-date-time?change=${change}`,
    )
  })
  it('should return date-time url if no date-time (and previous conditions not met)', () => {
    const req = buildRequest({
      date: null,
    })
    expect(findUncompleted()(req, res)).toBe(
      `/case/${crn}/arrange-appointment/${id}/location-date-time?change=${change}`,
    )
  })
  it('should return supporting information if no sensitivity (and previous conditions not met)', () => {
    const req = buildRequest({
      sensitivity: null,
    })
    expect(findUncompleted()(req, res)).toBe(
      `/case/${crn}/arrange-appointment/${id}/supporting-information?change=${change}`,
    )
  })
  it('should return text message confirmation if no smsOptIn', () => {
    const req = buildRequest({
      smsOptIn: null,
    })
    expect(findUncompleted()(req, res)).toBe(
      `/case/${crn}/arrange-appointment/${id}/text-message-confirmation?change=${change}`,
    )
  })
  it('should not return text message confirmation if no smsOptIn and sms feature flag is disabled', () => {
    const req = buildRequest({
      smsOptIn: null,
    })
    const mockRes = buildResponse({
      flags: {
        enableSmsReminders: false,
      },
    })
    expect(findUncompleted()(req, mockRes)).toBe(change)
  })
  it('should return attended-complied if enableNonCompliance feature flag is disabled, no outcomeRecorded value in appointment session and appointment date is in past', () => {
    mockAppointmentDateIsInPast.mockImplementationOnce(() => true)
    const req = buildRequest({
      outcomeRecorded: null,
    })
    const mockRes = buildResponse({
      flags: {
        enableNonCompliance: false,
      },
    })
    expect(findUncompleted()(req, mockRes)).toBe(
      `/case/${crn}/arrange-appointment/${id}/attended-complied?change=${change}`,
    )
  })
  it('should return change url if  enableNonCompliance feature flag is disabled,  no outcomeRecorded value in appointment session and appointment date is in future', () => {
    const req = buildRequest({
      outcomeRecorded: null,
    })
    const mockRes = buildResponse({
      flags: {
        enableNonCompliance: false,
      },
    })
    expect(findUncompleted()(req, mockRes)).toBe(change)
  })
  it('should return outcome if enableNonCompliance feature flag is enabled, no outcome type value in appointment session and appointment date is in past', () => {
    mockAppointmentDateIsInPast.mockImplementationOnce(() => true)
    const req = buildRequest({
      outcome: {
        type: null,
      },
    })

    expect(findUncompleted()(req, res)).toBe(`/case/${crn}/arrange-appointment/${id}/outcome?change=${change}`)
  })
  it('should return change url if  enableNonCompliance feature flag is enabled,  no outcome type value in appointment session and appointment date is in future', () => {
    const req = buildRequest({
      outcome: {
        type: null,
      },
    })

    expect(findUncompleted()(req, res)).toBe(change)
  })
})
