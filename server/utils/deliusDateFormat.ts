import { DateTime } from 'luxon'

export const deliusDateFormat = (datetime: string) => {
  if (!datetime) return ''
  return DateTime.fromISO(datetime).toFormat('dd/MM/yyyy')
}
