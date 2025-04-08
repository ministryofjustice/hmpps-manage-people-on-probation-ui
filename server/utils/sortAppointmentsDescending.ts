import { Activity } from '../data/model/schedule'

export const sortAppointmentsDescending = (appointments: Activity[], limit?: number): Activity[] => {
  return [...appointments]
    .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime())
    .filter((_, index) => (limit && index < limit) || !limit)
}
