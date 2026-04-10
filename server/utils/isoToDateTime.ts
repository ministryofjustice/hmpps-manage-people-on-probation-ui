import { DateTime } from 'luxon'

export const isoToDateTime = (iso: string): { date: string; time: string } => {
  const dt = DateTime.fromISO(iso, { zone: 'Europe/London' })
  return {
    date: dt.toFormat('yyyy-MM-dd'),
    time: dt.toFormat('HH:mm'),
  }
}
