import { DateTime } from 'luxon'
import { isBlank } from './isBlank'

export const yearsSince = (datetimeString: string): string | null => {
  if (!datetimeString || isBlank(datetimeString)) return null
  return DateTime.now()
    .setZone('Europe/London')
    .diff(DateTime.fromISO(datetimeString), ['years', 'months'])
    .years.toString()
}
