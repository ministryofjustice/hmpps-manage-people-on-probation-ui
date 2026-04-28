/**
 * 09:00 → 9:00am
 */
import { DateTime } from 'luxon'

export const toIso12HourTimeWithMinutes = (time: string): string => {
  return DateTime.fromISO(time, { zone: 'utc' }) // read as UTC
    .setZone('Europe/London') // convert to UK time
    .toFormat('h:mma')
    .toLowerCase()
}
