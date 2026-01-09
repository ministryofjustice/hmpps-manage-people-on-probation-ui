import httpMocks from 'node-mocks-http'
import { AppointmentSession } from '../models/Appointments'
import { findUncompleted } from './findUncompleted'
import { appointmentDateIsInPast } from './appointmentDateIsInPast'
import { getDataValue } from '../utils'
import { Name } from '../data/model/personalDetails'

const crn = 'X000001'
const id = '1'
const change = 'changeUrl'

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    getDataValue: jest.fn(),
  }
})

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
  repeating: 'No',
  interval: 'DAY',
  numberOfAppointments: '1',
  numberOfRepeatAppointments: '0',
  sensitivity: 'Yes',
  outcomeRecorded: 'Yes',
}

const mockGetDataValue = getDataValue as jest.MockedFunction<typeof getDataValue>
const mockAppointmentDateIsInPast = appointmentDateIsInPast as jest.MockedFunction<typeof appointmentDateIsInPast>

mockAppointmentDateIsInPast.mockImplementation(() => false)

const res = httpMocks.createResponse()

const buildRequest = (session?: Record<string, string | Record<string, string | Name>>): httpMocks.MockRequest<any> => {
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
      },
    },
  }
  return httpMocks.createRequest(req)
}

describe('middleware/findUncompleted', () => {
  it('should return change url if all required appointment data provided', () => {
    const req = buildRequest()
    mockGetDataValue.mockImplementationOnce(() => req.session.data.appointments[crn][id])
    expect(findUncompleted(req, res)).toBe(change)
  })
  it('should return sentence url if no eventId', () => {
    const req = buildRequest({ eventId: null })
    mockGetDataValue.mockImplementationOnce(() => req.session.data.appointments[crn][id])
    expect(findUncompleted(req, res)).toBe(`/case/${crn}/arrange-appointment/${id}/sentence?change=${change}`)
  })
  it('should return type url if no type (and previous conditions not met)', () => {
    const req = buildRequest({ type: null })
    mockGetDataValue.mockImplementationOnce(() => req.session.data.appointments[crn][id])
    expect(findUncompleted(req, res)).toBe(`/case/${crn}/arrange-appointment/${id}/type-attendance?change=${change}`)
  })
  it('should return attendance url if no user info (and previous conditions not met)', () => {
    const req = buildRequest({
      user: {
        ...mockAppointmentSession.user,
        username: null,
      },
    })
    mockGetDataValue.mockImplementationOnce(() => req.session.data.appointments[crn][id])
    expect(findUncompleted(req, res)).toBe(`/case/${crn}/arrange-appointment/${id}/attendance?change=${change}`)
  })
  it('should return location url if no location (and previous conditions not met)', () => {
    const req = buildRequest({
      user: {
        ...mockAppointmentSession.user,
        locationCode: null,
      },
    })
    mockGetDataValue.mockImplementationOnce(() => req.session.data.appointments[crn][id])
    expect(findUncompleted(req, res)).toBe(`/case/${crn}/arrange-appointment/${id}/location-date-time?change=${change}`)
  })
  it('should return date-time url if no date-time (and previous conditions not met)', () => {
    const req = buildRequest({
      date: null,
    })
    mockGetDataValue.mockImplementationOnce(() => req.session.data.appointments[crn][id])
    expect(findUncompleted(req, res)).toBe(`/case/${crn}/arrange-appointment/${id}/location-date-time?change=${change}`)
  })
  it('should return supporting information if no sensitivity (and previous conditions not met)', () => {
    const req = buildRequest({
      sensitivity: null,
    })
    mockGetDataValue.mockImplementationOnce(() => req.session.data.appointments[crn][id])
    expect(findUncompleted(req, res)).toBe(
      `/case/${crn}/arrange-appointment/${id}/supporting-information?change=${change}`,
    )
  })
  it('should return attended-complied if no outcomeRecorded value in appointment session and appointment date is in past', () => {
    mockAppointmentDateIsInPast.mockImplementationOnce(() => true)
    const req = buildRequest({
      outcomeRecorded: null,
    })
    mockGetDataValue.mockImplementationOnce(() => req.session.data.appointments[crn][id])
    expect(findUncompleted(req, res)).toBe(`/case/${crn}/arrange-appointment/${id}/attended-complied?change=${change}`)
  })
  it('should return change url in no outcomeRecorded value in appointment session and appointment date is in future', () => {
    const req = buildRequest({
      outcomeRecorded: null,
    })
    mockGetDataValue.mockImplementationOnce(() => req.session.data.appointments[crn][id])
    expect(findUncompleted(req, res)).toBe(change)
  })
})
