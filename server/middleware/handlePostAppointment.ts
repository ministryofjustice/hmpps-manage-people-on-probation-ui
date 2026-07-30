import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import { AppointmentSession, RescheduleAppointmentResponse, AppointmentsPostResponse } from '../models/Appointments'
import { Data } from '../models/Data'
import { isValidCrn, isValidUUID, getDataValue, setDataValue } from '../utils'
import { findUncompleted } from './findUncompleted'
import { postAppointments } from './postAppointments'
import { postRescheduleAppointments } from './postRescheduleAppointments'
import { renderError } from './renderError'

export const handlePostAppointment = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async function handlePostAppointmentInner(req, res, next) {
    const { data } = req.session
    const { crn, id: uuid, contactId } = req.params as Record<string, string>
    if (!isValidCrn(crn) || !isValidUUID(uuid)) {
      return renderError(404)(req, res)
    }
    const id = uuid || contactId
    const appointment = getDataValue<AppointmentSession>(data, ['appointments', crn, id])
    const sensitivityLocked = appointment?.sensitivityLocked
    const rescheduleAppointment = appointment?.rescheduleAppointment
    if (sensitivityLocked && res.locals.flags?.enableSensitivityRemoved) {
      setDataValue(data, ['appointments', crn, id, 'sensitivity'], 'Yes')
    }

    let responseContactId: number

    const uncompleted = findUncompleted({ forceValidation: true })(req, res)
    if (uncompleted?.includes('?change')) {
      return res.redirect(uncompleted)
    }

    if (rescheduleAppointment?.contactId) {
      const response: RescheduleAppointmentResponse = await postRescheduleAppointments(hmppsAuthClient)(req, res)
      responseContactId = response.id
    } else {
      const response: AppointmentsPostResponse = await postAppointments(hmppsAuthClient)(req, res)
      responseContactId = response.appointments[response.appointments.length - 1].id
    }

    // add the responseContactId to session 👇

    setDataValue<Data, string>(data, ['temp', crn, 'responseContactId'], String(responseContactId))

    // clone the appointment and reference by responseContactId 👇

    setDataValue<Data, AppointmentSession>(data, ['appointments', crn, String(responseContactId)], appointment)

    return next()
  }
}
