import { DateTime } from 'luxon'
import { isBlank } from './isBlank'

export const dayOfWeek = (datetimeString: string) => {
  if (!datetimeString || isBlank(datetimeString)) return null
  return DateTime.fromISO(datetimeString).toFormat('cccc')
}
