import { DateTime } from 'luxon'
import { isBlank } from './isBlank'

export const toIsoDateFromPicker = (datetimeString: string): string => {
  if (!datetimeString || isBlank(datetimeString)) return null
  const converted = DateTime.fromFormat(datetimeString, 'd/M/yyyy').toFormat('yyyy-MM-dd')
  if (converted === 'Invalid DateTime') {
    return datetimeString
  }
  return converted
}

export const toIsoDateTimeFromPicker = (datetimeString: string): string => {
  if (!datetimeString || isBlank(datetimeString)) return null

  const converted = DateTime.fromFormat(datetimeString, 'd/M/yyyy').toFormat('yyyy-MM-dd')
  if (converted === 'Invalid DateTime') {
    return null
  }
  return `${converted}T00:00:00.000Z`
}
