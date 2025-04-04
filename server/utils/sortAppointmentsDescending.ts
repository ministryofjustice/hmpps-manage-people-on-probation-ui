import { Activity } from '../data/model/schedule'

export const sortAppointmentsDescending = (appointments: Activity[], limit?: number): Activity[] => {
  return [...appointments]
    .sort((a, b) => (a.startDateTime < b.startDateTime ? 1 : -1))
    .filter((_, index) => (limit && index < limit) || !limit)
}
