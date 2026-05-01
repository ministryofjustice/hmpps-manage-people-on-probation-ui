import { DateTime } from 'luxon'

export const isoToDateTime = (iso: string): { date: string; time: string } => {
  const dt = DateTime.fromISO(iso, { zone: 'utc' })
  return {
    date: dt.toFormat('yyyy-MM-dd'),
    time: dt.toFormat('HH:mm'),
  }
}
