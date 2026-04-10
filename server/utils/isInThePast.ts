import { DateTime } from 'luxon'
import { isBlank } from './isBlank'

export const isInThePast = (datetimeString: string) => {
  if (!datetimeString || isBlank(datetimeString)) return null
  return DateTime.now().setZone('Europe/London') > DateTime.fromISO(datetimeString)
}
