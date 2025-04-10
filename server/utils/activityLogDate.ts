import { DateTime } from 'luxon'
import { isBlank } from './isBlank'

export const activityLogDate = (datetimeString: string) => {
  if (!datetimeString || isBlank(datetimeString)) return null
  const date = DateTime.fromISO(datetimeString)
  if (date.hasSame(DateTime.local(), 'day')) {
    return 'Today'
  }
  if (date.hasSame(DateTime.local().minus({ days: 1 }), 'day')) {
    return 'Yesterday'
  }
  return date.toFormat('cccc d MMMM yyyy')
}
