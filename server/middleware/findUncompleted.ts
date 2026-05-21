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
  ]
  if (res.locals.flags.enableNonCompliance) {
    mapping.push([appointment?.outcome?.outcomeType, 'outcome'])
  } else {
    mapping.push([appointment?.outcomeRecorded, 'attended-complied'])
  }
  if (res.locals.flags.enableNonCompliance) {
    mapping.push([appointment?.sensitivity, dateInPast ? 'outcome/add-note' : 'supporting-information'])
  } else {
    mapping.push([appointment?.sensitivity, dateInPast ? 'add-note' : 'supporting-information'])
  }
  let appointmentIsIncomplete = false
  for (const [value, redirect] of mapping) {
    appointmentIsIncomplete = !value
    if (['attended-complied', 'outcome'].includes(redirect)) {
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
