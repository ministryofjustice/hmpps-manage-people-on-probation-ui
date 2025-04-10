import { DateTime } from 'luxon'
import { isBlank } from './isBlank'

export const isToday = (datetimeString: string) => {
  if (!datetimeString || isBlank(datetimeString)) return null
  return DateTime.fromISO(datetimeString).hasSame(DateTime.now(), 'day')
}
