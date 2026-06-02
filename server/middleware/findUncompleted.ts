import { Request, Response } from 'express'
import { getDataValue } from '../utils'
import { appointmentDateIsInPast } from './appointmentDateIsInPast'
import { AppointmentSession } from '../models/Appointments'
import { Route } from '../@types'

export const findUncompleted = ({ forceValidation = false } = {}): Route<string | null> => {
  return (req, res) => {
    const { crn, id } = req.params as Record<string, string>
    const { change } = req.query as Record<string, string>
    const changeUrl = change ? encodeURIComponent(change) : req.url
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
    if (dateInPast) {
      if (res.locals.flags.enableNonCompliance) {
        mapping.push([appointment?.outcome?.outcomeType, 'outcome'])
        mapping.push([appointment?.sensitivity, 'outcome/add-note'])
      } else {
        mapping.push([appointment?.outcomeRecorded, 'attended-complied'])
        mapping.push([appointment?.sensitivity, 'add-note'])
      }
    } else {
      mapping.push([appointment?.sensitivity, 'supporting-information'])
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
        return `/case/${crn}/arrange-appointment/${id}/${redirect}?change=${changeUrl}${forceValidation ? `&validation=true` : ''}`
      }
    }
    return decodeURIComponent(changeUrl)
  }
}
