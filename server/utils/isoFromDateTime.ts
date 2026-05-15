import { DateTime } from 'luxon'

export const isoFromDateTime = (date?: string, time?: string): string | null => {
  const dt = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm', { zone: 'Europe/London' })
  return dt.toISO()
}
