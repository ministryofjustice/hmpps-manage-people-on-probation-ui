import { DateTime } from 'luxon'
import { Activity } from '../data/model/schedule'

export const sortAppointmentsDescending = (appointments: Activity[], limit?: number): Activity[] => {
  return [...appointments]
    .sort((a, b) => DateTime.fromISO(b.startDateTime).toMillis() - DateTime.fromISO(a.startDateTime).toMillis())
    .filter((_, index) => (limit && index < limit) || !limit)
}
