/* eslint-disable no-underscore-dangle */
import { DateTime } from 'luxon'

export const getMinMaxDates = (): { _minDate: string; _maxDate: string } => {
  const today = new Date()
  // setting temporary fix for minDate
  // (https://github.com/ministryofjustice/moj-frontend/issues/923)

  let _minDate: string
  if (today.getDate() > 9) {
    today.setDate(today.getDate() - 1)
    _minDate = DateTime.fromJSDate(today).toFormat('dd/M/yyyy')
  } else {
    _minDate = DateTime.fromJSDate(today).toFormat('d/M/yyyy')
  }
  const _maxDate = DateTime.fromISO('2199-12-31').toFormat('d/M/yyyy')

  return { _minDate, _maxDate }
}
