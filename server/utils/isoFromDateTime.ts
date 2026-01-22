import { DateTime } from 'luxon'

export const isoFromDateTime = (date: string, time: string): string => {
  const dt = DateTime.fromFormat(`${date} ${time}`, 'dd/MM/yyyy HH:mm', { zone: 'utc' })
  return dt.toISO()
}
