import { AppointmentSession } from '../models/Appointments'
import { findUncompleted } from './findUncompleted'

const crn = 'X000001'
const id = '1'
const change = 'changeUrl'

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
}

describe('utils/findUncompleted', () => {
  it('returns change url if all required appointment data provided', () => {
    expect(findUncompleted(mockAppointmentSession, crn, id, change)).toBe(change)
  })
  it('returns sentence url if no eventId', () => {
    const session: AppointmentSession = {
      ...mockAppointmentSession,
      eventId: null,
    }
    expect(findUncompleted(session, crn, id, change)).toBe(
      `/case/${crn}/arrange-appointment/${id}/sentence?change=${change}`,
    )
  })
  it('returns type url if no type (and previous conditions not met)', () => {
    const session: AppointmentSession = {
      ...mockAppointmentSession,
      type: null,
    }
    expect(findUncompleted(session, crn, id, change)).toBe(
      `/case/${crn}/arrange-appointment/${id}/type?change=${change}`,
    )
  })
  it('returns attendance url if no user info (and previous conditions not met)', () => {
    const session: AppointmentSession = {
      ...mockAppointmentSession,
      user: {
        ...mockAppointmentSession.user,
        username: null,
      },
    }
    expect(findUncompleted(session, crn, id, change)).toBe(
      `/case/${crn}/arrange-appointment/${id}/attendance?change=${change}`,
    )
  })
  it('returns location url if no location (and previous conditions not met)', () => {
    const session: AppointmentSession = {
      ...mockAppointmentSession,
      user: {
        ...mockAppointmentSession.user,
        locationCode: null,
      },
    }
    expect(findUncompleted(session, crn, id, change)).toBe(
      `/case/${crn}/arrange-appointment/${id}/location-date-time?change=${change}`,
    )
  })
  it('returns date-time url if no date-time (and previous conditions not met)', () => {
    const session: AppointmentSession = {
      ...mockAppointmentSession,
      date: null,
    }
    expect(findUncompleted(session, crn, id, change)).toBe(
      `/case/${crn}/arrange-appointment/${id}/location-date-time?change=${change}`,
    )
  })
  it('returns supporting information if no sensitivity (and previous conditions not met)', () => {
    const session: AppointmentSession = {
      ...mockAppointmentSession,
      sensitivity: null,
    }
    expect(findUncompleted(session, crn, id, change)).toBe(
      `/case/${crn}/arrange-appointment/${id}/supporting-information?change=${change}`,
    )
  })
})
