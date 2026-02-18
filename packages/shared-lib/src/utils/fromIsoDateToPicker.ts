import { DateTime } from 'luxon'
import { isBlank } from './isBlank'

export const fromIsoDateToPicker = (datetimeString: string): string | null => {
  if (!datetimeString || isBlank(datetimeString)) return null
  if (!DateTime.fromFormat(datetimeString, 'yyyy-MM-dd').isValid) {
    return datetimeString
  }
  const converted = DateTime.fromISO(datetimeString).toFormat('d/M/yyyy')
  if (converted === 'Invalid DateTime') {
    return datetimeString
  }
  return converted
}
