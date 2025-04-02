import { DateTime } from 'luxon'
import { isBlank } from './isBlank'

export const dateWithYear = (datetimeString: string): string | null => {
  if (!datetimeString || isBlank(datetimeString)) return ''
  return DateTime.fromISO(datetimeString).toFormat('d MMMM yyyy')
}
