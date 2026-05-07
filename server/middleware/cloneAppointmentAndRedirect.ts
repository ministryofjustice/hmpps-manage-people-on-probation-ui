import { Request } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AppointmentSession, RescheduleAppointment } from '../models/Appointments'
import { AppResponse } from '../models/Locals'
import { getDataValue, setDataValue } from '../utils'

export const cloneAppointmentAndRedirect = (appointmentToClone: AppointmentSession, apptType?: string) => {
  return (req: Request, res: AppResponse): void => {
    let uuid = uuidv4()
    const { data } = req.session
    const { crn, id, contactId } = req.params as Record<string, string>
    // for next-appointment of type: 'KEEP_TYPE'
    let redirectURL = `/case/${crn}/arrange-appointment/${uuid}/arrange-another-appointment`
    let isSensitive
    if (apptType === 'RESCHEDULE') {
      uuid = id
      isSensitive = getDataValue(data, ['appointments', crn, uuid, 'rescheduleAppointment', 'sensitivity'])
      redirectURL = `/case/${crn}/appointments/reschedule/${contactId}/${id}/check-your-answers`
    }
    const clonedAppt: AppointmentSession = {
      ...appointmentToClone,
      uuid,
      date: '',
      start: '',
      end: '',
      notes: null,
      sensitivity: isSensitive === 'Yes' ? isSensitive : appointmentToClone.sensitivity,
      sensitivityLocked: appointmentToClone.sensitivity === 'Yes' || isSensitive === 'Yes',
    }
    setDataValue(data, ['appointments', crn, uuid], clonedAppt)
    return res.redirect(redirectURL)
  }
}
