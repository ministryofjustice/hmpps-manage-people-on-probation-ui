import { PersonAppointment } from '../data/model/schedule'

export const canRescheduleAppointment = (personAppointment: PersonAppointment): boolean => {
  const { appointment } = personAppointment
  const { deliusManaged = true, hasOutcome = false } = appointment
  if (deliusManaged) return false
  return true
}
