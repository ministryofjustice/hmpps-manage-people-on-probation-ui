import { DateTime } from 'luxon'
import { isBlank } from './isBlank'
import { govukTime } from './govukTime'

export const dateWithYear = (datetimeString: string, showTime = false): string | null => {
  if (!datetimeString || isBlank(datetimeString)) return ''
  return `${DateTime.fromISO(datetimeString).toFormat('d MMMM yyyy')}${showTime ? ` at ${govukTime(datetimeString)}` : ''}`
}
export const dateToLongDate = (dmyDate: string): string | null => {
  if (!dmyDate || isBlank(dmyDate)) return ''
  const dt = DateTime.fromFormat(dmyDate, 'dd/MM/yyyy')
  if (!dt.isValid) return dmyDate
  return dt.toFormat('d MMMM yyyy')
}
