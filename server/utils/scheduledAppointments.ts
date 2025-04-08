import { Activity } from '../data/model/schedule'
import { isInThePast } from './isInThePast'

export const scheduledAppointments = (appointments: Activity[]): Activity[] => {
  return (
    // Show future appointments and any appointments that are today
    appointments
      .filter(entry => !isInThePast(entry.startDateTime))
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
  )
}
