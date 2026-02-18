import { DateTime } from 'luxon'
import { isBlank } from './isBlank'

export const monthsOrDaysElapsed = (datetimeString: string): string | null => {
  if (!datetimeString || isBlank(datetimeString)) return null
  const months = DateTime.now().diff(DateTime.fromISO(datetimeString), ['months', 'days']).months.toString()
  const days = DateTime.now().diff(DateTime.fromISO(datetimeString), ['days', 'hours']).days.toString()
  if (months === '0') {
    return `${days} days`
  }
  return `${months} months`
}
