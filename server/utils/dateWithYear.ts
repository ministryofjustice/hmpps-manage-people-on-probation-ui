import { DateTime } from 'luxon'
import { isBlank } from './isBlank'
import { govukTime } from './govukTime'

export const dateWithYear = (datetimeString: string, showTime = false): string | null => {
  if (!datetimeString || isBlank(datetimeString)) return ''
  return `${DateTime.fromISO(datetimeString).toFormat('d MMMM yyyy')}${showTime ? ` at ${govukTime(datetimeString)}` : ''}`
}
