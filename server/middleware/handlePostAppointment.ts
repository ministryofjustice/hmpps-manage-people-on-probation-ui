import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import { AppointmentSession, RescheduleAppointmentResponse, AppointmentsPostResponse } from '../models/Appointments'
import { Data } from '../models/Data'
import { isValidCrn, isValidUUID, getDataValue, setDataValue, isNumericString } from '../utils'
import { findUncompleted } from './findUncompleted'
import { postAppointments } from './postAppointments'
import { postRescheduleAppointments } from './postRescheduleAppointments'
import { renderError } from './renderError'

export const handlePostAppointment = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async function handlePostAppointmentInner(req, res, next) {
    const { data } = req.session
    const { crn, id: uuid, contactId } = req.params as Record<string, string>
    let isValidId = false
    if (res?.locals?.flags?.enableCombinedCYAPage) {
      isValidId = uuid ? isValidUUID(uuid) : isNumericString(contactId)
    } else {
      isValidId = isValidUUID(uuid)
    }
    if (!isValidCrn(crn) || !isValidId) {
      return renderError(404)(req, res)
    }
    const id = uuid || contactId
    const appointment = getDataValue<AppointmentSession>(data, ['appointments', crn, id])
    const sensitivityLocked = appointment?.sensitivityLocked
    const url = req.url.split('?')[0]
    const rescheduleAppointment = appointment?.rescheduleAppointment

    if (sensitivityLocked && res.locals.flags?.enableSensitivityRemoved) {
      setDataValue(data, ['appointments', crn, id, 'sensitivity'], 'Yes')
    }

    let responseContactId: number

    const uncompleted = findUncompleted({ forceValidation: true })(req, res)
    if (uncompleted?.includes('?change')) {
      return res.redirect(uncompleted)
    }

    if (res?.locals?.flags?.enableCombinedCYAPage) {
      const nextAppointmentId = getDataValue(data, ['temp', crn, 'nextAppointmentId']) || null
      const linkedContactId = getDataValue(data, ['temp', crn, 'linkedContactId']) || null

      // if on outcome check your answers page and there is no nextAppointmentId, call next() 👇
      if (url.includes('/outcome/check-your-answers') && !nextAppointmentId) {
        return next()
      }
      // if on arrange another appointment page and nextAppointmentId and linkedContactId exist, redirect to outcome check your answers page 👇
      if (linkedContactId && nextAppointmentId && url.includes('/arrange-another-appointment')) {
        return res.redirect(`/case/${crn}/appointments/appointment/${linkedContactId}/outcome/check-your-answers`)
      }
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
