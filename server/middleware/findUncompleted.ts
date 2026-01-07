import { Request, Response } from 'express'
import { getDataValue } from '../utils'
import { appointmentDateIsInPast } from './appointmentDateIsInPast'

export const findUncompleted = (req: Request, res: Response): string => {
  const { crn, id } = req.params
  const { change } = req.query as Record<string, string>
  const data = req?.session?.data ?? {}
  const appointment = getDataValue(data, ['appointments', crn, id])

  const dateInPast = appointmentDateIsInPast(req)

  const mapping: [string | undefined, string][] = [
    [appointment?.eventId, 'sentence'],
    [appointment?.type, 'type-attendance'],
    [appointment?.user?.username, 'attendance'],
    [appointment?.user?.locationCode, 'location-date-time'],
    [appointment?.date, 'location-date-time'],
    [appointment?.outcomeRecorded, 'attended-complied'],
    [appointment?.sensitivity, dateInPast ? 'add-note' : 'supporting-information'],
  ]
  let appointmentIsIncomplete = false
  for (const [value, redirect] of mapping) {
    appointmentIsIncomplete = redirect !== 'attended-complied' ? !value : !value && dateInPast
    if (appointmentIsIncomplete) {
      return `/case/${crn}/arrange-appointment/${id}/${redirect}?change=${change}`
    }
  }
  return change
}
