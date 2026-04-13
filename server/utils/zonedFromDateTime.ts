import { DateTime } from 'luxon'

export const zonedFromDateTime = (date: string, time: string): string => {
  const dt = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm', { zone: 'Europe/London' })
  return dt.toISO()
}
