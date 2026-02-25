import { Activity } from '../data/model/schedule'
import { pastAppointments } from './pastAppointments'

export const getAppointmentsToAction = (appointments: Activity[], type: string): Activity[] => {
  if (type === 'evidence') {
    return pastAppointments(appointments).filter(entry => entry.absentWaitingEvidence === true)
  }
  return pastAppointments(appointments).filter(
    entry =>
      entry.hasOutcome === false &&
      (entry.absentWaitingEvidence === false || entry.absentWaitingEvidence === undefined),
  )
}
