import { DateTime } from 'luxon'

export const dateToTimestamp = (dateString?: string): number | null => {
  if (!dateString) return null
  return DateTime.fromISO(dateString).toMillis()
}
