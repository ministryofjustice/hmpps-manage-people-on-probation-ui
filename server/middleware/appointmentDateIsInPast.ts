import { DateTime } from 'luxon'
import { Request, Response } from 'express'
import { dateIsInPast, getDataValue } from '../utils'

export const appointmentDateIsInPast = (req: Request, _res?: Response): boolean => {
  const { crn, id } = req.params
  let date: string
  let start: string
  let isInPast = false
  let format: string
  const { data } = req.session
  if (req.method === 'POST' && req.body?.appointments?.[crn]?.[id]?.date) {
    ;({ date, start } = req.body.appointments[crn][id])
    format = 'd/M/yyyy'
  }
  if (!date) {
    ;({ date, start } = getDataValue(data, ['appointments', crn, id]))
    format = 'yyyy-M-d'
  }
  if (date) {
    const dt = DateTime.fromFormat(date, format)
    if (dt.isValid) {
      ;({ isInPast } = dateIsInPast(dt.toFormat('yyyy-M-d'), start))
    }
  }
  return isInPast
}
