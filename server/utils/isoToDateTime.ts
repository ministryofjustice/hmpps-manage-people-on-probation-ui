import { DateTime } from 'luxon'

export const isoToDateTime = (iso: string): { date: string; time: string } => {
  const dt = DateTime.fromISO(iso, { zone: 'utc' })
  return {
    date: dt.toFormat('dd/MM/yyyy'),
    time: dt.toFormat('HH:mm'),
  }
}
