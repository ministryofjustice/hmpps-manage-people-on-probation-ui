import { PersonAppointment } from '../data/model/schedule'
import { isInThePast } from './isInThePast'

export const canRescheduleAppointment = (personAppointment: PersonAppointment): boolean => {
  const { appointment } = personAppointment
  const { startDateTime = null } = appointment
  if (!startDateTime) return false
  const appointmentIsInThePast = isInThePast(startDateTime)
  if (appointmentIsInThePast && appointment?.hasOutcome) {
    return false
  }
  return true
}
