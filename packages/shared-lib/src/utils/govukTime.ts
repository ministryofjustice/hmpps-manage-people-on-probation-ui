import { DateTime } from 'luxon'
import { isBlank } from './isBlank'

export const govukTime = (datetimeString: string): string | null => {
  if (!datetimeString || isBlank(datetimeString)) return null
  const datetime = DateTime.fromISO(datetimeString)
  const hourMinuteFormat = datetime.minute === 0 ? 'ha' : 'h:mma'
  return datetime.toFormat(hourMinuteFormat).toLowerCase()
}
