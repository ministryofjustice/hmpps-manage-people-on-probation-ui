import { DateTime } from 'luxon'
import { Activity } from '../data/model/schedule'
import { isInThePast } from './isInThePast'

export const pastAppointments = (appointments: Activity[]): Activity[] => {
  return appointments
    .filter(entry => isInThePast(entry.startDateTime))
    .sort((a, b) => DateTime.fromISO(b.startDateTime).toMillis() - DateTime.fromISO(a.startDateTime).toMillis())
}
