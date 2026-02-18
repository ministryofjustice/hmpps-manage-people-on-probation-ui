import { DateTime } from 'luxon'
import { isBlank } from './isBlank'
import { govukTime } from './govukTime'

export const dateWithYearShortMonthAndTime = (datetimeString: string): string | null => {
  if (!datetimeString || isBlank(datetimeString)) return null
  const date = DateTime.fromISO(datetimeString).toFormat('d MMM yyyy')
  return `${date} at ${govukTime(datetimeString)}`
}
