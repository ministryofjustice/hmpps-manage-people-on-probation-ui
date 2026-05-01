/**
 * 09:00 → 9:00am
 */
import { DateTime } from 'luxon'

export const to12HourTimeWithMinutes = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'pm' : 'am'
  const hour12 = hours % 12 || 12

  return `${hour12}:${minutes.toString().padStart(2, '0')}${period}`
}

export const toIso12HourTimeWithMinutes = (time: string): string => {
  return DateTime.fromISO(time, { zone: 'utc' }) // read as UTC
    .setZone('Europe/London') // convert to UK time
    .toFormat('h:mma')
    .toLowerCase()
}
