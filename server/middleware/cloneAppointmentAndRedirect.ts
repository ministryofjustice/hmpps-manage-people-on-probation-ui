import { Request } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AppointmentSession, AppointmentSessionSelection } from '../models/Appointments'
import { AppResponse } from '../models/Locals'
import { getDataValue, setDataValue } from '../utils'

export const cloneAppointmentAndRedirect = (
  appointmentToClone: AppointmentSession = {},
  apptType: AppointmentSessionSelection = 'KEEP_TYPE',
) => {
  return (req: Request, res: AppResponse): void => {
    const { data } = req.session
    const { crn, id, contactId } = req.params as Record<string, string>
    const uuid = apptType === 'RESCHEDULE' ? id : uuidv4()
    const { url } = req
    let redirectURL = `/case/${crn}/arrange-appointment/${uuid}/arrange-another-appointment`

    if (apptType === 'CHANGE_TYPE') {
      redirectURL = `/case/${crn}/arrange-appointment/${uuid}/sentence?back=${url}`
    }

    let clonedAppt: AppointmentSession = {
      ...appointmentToClone,
      uuid,
      date: '',
      start: '',
      end: '',
      notes: null,
    }
    clonedAppt.sensitivity = appointmentToClone?.sensitivity || null

    if (apptType === 'RESCHEDULE') {
      clonedAppt = {
        ...clonedAppt,
        sensitivity:
          getDataValue(data, ['appointments', crn, uuid, 'rescheduleAppointment', 'sensitivity']) ||
          clonedAppt.sensitivity,
        rescheduleAppointment: {
          contactId,
          ...(appointmentToClone?.rescheduleAppointment || {}),
        },
      }
      clonedAppt.sensitivityLocked = clonedAppt?.sensitivity === 'Yes'

      redirectURL = `/case/${crn}/arrange-appointment/${id}/check-your-answers`
    }
    if (apptType !== 'RESCHEDULE') {
      clonedAppt.sensitivity = null
      clonedAppt.sensitivityLocked = false
    }
    if (req.url.includes('/outcome/next-appointment')) {
      setDataValue(data, ['temp', crn, 'linkedContactId'], contactId)
    }
    setDataValue(data, ['appointments', crn, uuid], clonedAppt)
    return res.redirect(redirectURL)
  }
}
