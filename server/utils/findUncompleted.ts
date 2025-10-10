import { AppointmentSession } from '../models/Appointments'

export const findUncompleted = (appointment: AppointmentSession, crn: string, id: string, change: string): string => {
  if (!appointment?.eventId) {
    return `/case/${crn}/arrange-appointment/${id}/sentence?change=${change}`
  }
  if (!appointment?.type) {
    return `/case/${crn}/arrange-appointment/${id}/type?change=${change}`
  }
  if (!appointment?.user?.username) {
    return `/case/${crn}/arrange-appointment/${id}/attendance?change=${change}`
  }
  if (!appointment?.user.locationCode) {
    return `/case/${crn}/arrange-appointment/${id}/location?change=${change}`
  }
  if (!appointment?.date) {
    return `/case/${crn}/arrange-appointment/${id}/date-time?change=${change}`
  }
  if (!appointment?.sensitivity) {
    return `/case/${crn}/arrange-appointment/${id}/supporting-information?change=${change}`
  }
  return change
}
