import { DateTime } from 'luxon'

const DEFAULT_ZONE = 'Europe/London'

const to12HourFormat = (value?: string): string => {
  if (!value) return ''

  if (value.includes('T')) {
    return DateTime.fromISO(value, { zone: DEFAULT_ZONE }).toFormat('h:mma').toLowerCase()
  }

  return DateTime.fromFormat(value, 'HH:mm').toFormat('h:mma').toLowerCase()
}

export default to12HourFormat
