import { AppointmentSession } from '../models/Appointments'

export const findUncompleted = (appointment: AppointmentSession, crn: string, id: string, change: string): string => {
  const mapping: [string | undefined, string][] = [
    [appointment?.eventId, 'sentence'],
    [appointment?.type, 'type'],
    [appointment?.user?.username, 'attendance'],
    [appointment?.user?.locationCode, 'location'],
    [appointment?.date, 'date-time'],
    [appointment?.sensitivity, 'supporting-information'],
  ]
  for (const [value, redirect] of mapping) {
    if (!value) return `/case/${crn}/arrange-appointment/${id}/${redirect}?change=${change}`
  }
  return change
}
