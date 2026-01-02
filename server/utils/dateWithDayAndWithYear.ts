import { DateTime } from 'luxon'
import { isBlank } from './isBlank'

export const dateWithDayAndWithYear = (datetimeString: string): string | null => {
  if (!datetimeString || isBlank(datetimeString)) return null
  return DateTime.fromISO(datetimeString).toFormat('cccc d MMMM yyyy')
}
