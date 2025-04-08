import { Activity } from '../data/model/schedule'
import { isInThePast } from './isInThePast'

export const pastAppointments = (appointments: Activity[]): Activity[] => {
  return appointments
    .filter(entry => isInThePast(entry.startDateTime))
    .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime())
}
