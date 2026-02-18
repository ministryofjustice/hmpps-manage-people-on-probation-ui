import { DateTime } from 'luxon'
import { isBlank } from './isBlank'

export const dateWithYearShortMonth = (datetimeString: string): string | null => {
  if (!datetimeString || isBlank(datetimeString)) return null
  return DateTime.fromISO(datetimeString).toFormat('d MMM yyyy')
}
