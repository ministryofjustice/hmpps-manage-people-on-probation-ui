import { Request, Response } from 'express'
import { getDataValue } from '../utils'
import { appointmentDateIsInPast } from './appointmentDateIsInPast'
import { AppointmentSession } from '../models/Appointments'

export const findUncompleted = (req: Request, res: Response): string => {
  const { crn, id } = req.params as Record<string, string>
  const { change } = req.query as Record<string, string>
  const data = req?.session?.data ?? {}
  const appointment = getDataValue<AppointmentSession>(data, ['appointments', crn, id])

  const dateInPast = appointmentDateIsInPast(req)

  const mapping: [string | undefined, string][] = [
    [appointment?.eventId, 'sentence'],
    [appointment?.type, 'type-attendance'],
    [appointment?.user?.username, 'attendance'],
    [appointment?.user?.locationCode, 'location-date-time'],
    [appointment?.date, 'location-date-time'],
    [appointment?.smsOptIn, 'text-message-confirmation'],
    [appointment?.outcomeRecorded, 'attended-complied'],
    [appointment?.sensitivity, dateInPast ? 'add-note' : 'supporting-information'],
  ]
  let appointmentIsIncomplete = false
  for (const [value, redirect] of mapping) {
    appointmentIsIncomplete = !value
    if (redirect === 'attended-complied') {
      appointmentIsIncomplete = !value && dateInPast
    }
    if (redirect === 'text-message-confirmation') {
      appointmentIsIncomplete = !value && !dateInPast
      if (res.locals?.flags?.enableSmsReminders === false) {
        appointmentIsIncomplete = false
      }
    }
    if (appointmentIsIncomplete) {
      return `/case/${crn}/arrange-appointment/${id}/${redirect}?change=${change}`
    }
  }
  return change
}
