import { Request } from 'express'
import { type AppResponse } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import { v4 as uuidv4 } from 'uuid'
import { AppointmentSession } from '../models/Appointments'
import { setDataValue } from '../utils'

export const cloneAppointmentAndRedirect = (appointmentToClone: AppointmentSession, apptType?: string) => {
  return (req: Request, res: AppResponse): void => {
    let uuid = uuidv4()
    const { data } = req.session
    const { crn, id, contactId } = req.params as Record<string, string>
    // for next-appointment of type: 'KEEP_TYPE'
    let redirectURL = `/case/${crn}/arrange-appointment/${uuid}/arrange-another-appointment`
    if (apptType === 'RESCHEDULE') {
      uuid = id
      redirectURL = `/case/${crn}/appointments/reschedule/${contactId}/${id}/check-your-answers`
    }
    const clonedAppt: AppointmentSession = {
      ...appointmentToClone,
      uuid,
      date: '',
      start: '',
      end: '',
      notes: null,
      sensitivity: null,
    }
    setDataValue(data, ['appointments', crn, uuid], clonedAppt)
    return res.redirect(redirectURL)
  }
}
