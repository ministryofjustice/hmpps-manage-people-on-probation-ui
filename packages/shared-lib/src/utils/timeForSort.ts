import { DateTime } from 'luxon'
import { isBlank } from './isBlank'

export const timeForSort = (datetimeString: string): number | null => {
  if (!datetimeString || isBlank(datetimeString)) return null
  return Number(DateTime.fromISO(datetimeString).toFormat('HHmm'))
}
