import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import { PersonAppointment } from '../data/model/schedule'
import { AppointmentSession, RescheduleAppointmentResponse, AppointmentsPostResponse } from '../models/Appointments'
import { Data } from '../models/Data'
import { isValidCrn, isValidUUID, getDataValue, setDataValue } from '../utils'
import { findUncompleted } from './findUncompleted'
import { postAppointments } from './postAppointments'
import { postRescheduleAppointments } from './postRescheduleAppointments'
import { renderError } from './renderError'

export const handlePostAppointment = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { data } = req.session
    const { crn, id, contactId } = req.params as Record<string, string>
    if (!isValidCrn(crn) || !isValidUUID(id)) {
      return renderError(404)(req, res)
    }

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
      const response: RescheduleAppointmentResponse | PersonAppointment = await postRescheduleAppointments(
        hmppsAuthClient,
      )(req, res)
      responseContactId = 'id' in response ? response.id : Number(contactId)
    } else {
      const response: AppointmentsPostResponse = await postAppointments(hmppsAuthClient)(req, res)
      responseContactId = response.appointments[response.appointments.length - 1].id
    }
    setDataValue<Data, string>(data, ['temp', crn, 'responseContactId'], String(responseContactId))
    // clone the appointment and reference by responseContactId, then delete appointment referenced by uuid
    setDataValue<Data, AppointmentSession>(data, ['appointments', crn, String(responseContactId)], appointment)
    // delete req.session.data.appointments[crn][id]
    return next()
  }
}
