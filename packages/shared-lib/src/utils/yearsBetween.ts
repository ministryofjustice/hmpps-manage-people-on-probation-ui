import { DateTime } from 'luxon'

export const yearsBetween = (fromDateTimeString: string, toDateTimeString: string): string | null => {
  if (!fromDateTimeString || !toDateTimeString) return null
  const fromDate = DateTime.fromISO(fromDateTimeString)
  const toDate = DateTime.fromISO(toDateTimeString)
  const { years } = toDate.diff(fromDate, ['years', 'months'])
  return years.toString()
}
