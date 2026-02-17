import { DateTime } from 'luxon'
import { isBlank } from './isBlank'

export const dateForSort = (datetimeString: string): number | null => {
  if (!datetimeString || isBlank(datetimeString)) return null
  return DateTime.fromISO(datetimeString).toMillis()
}
