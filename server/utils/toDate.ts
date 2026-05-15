import { DateTime } from 'luxon'
import { isBlank } from './isBlank'

export const toDate = (datetimeString?: string): DateTime | null => {
  if (!datetimeString || isBlank(datetimeString)) return null
  return DateTime.fromISO(datetimeString)
}
