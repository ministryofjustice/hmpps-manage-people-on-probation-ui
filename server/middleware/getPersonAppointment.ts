import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { getDataValue } from '../utils'
import { AppointmentSession } from '../models/Appointments'

export const getPersonAppointment = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, id } = req.params as Record<string, string>
    let { contactId } = req.params as Record<string, string>
    const data = req?.session?.data
    if (data) {
      const appointment = getDataValue<AppointmentSession>(data, ['appointments', crn, id])
      const responseContactId = getDataValue<string>(data, ['temp', crn, 'responseContactId'])
      if (!contactId && appointment?.rescheduleAppointment?.contactId) {
        ;({ contactId } = appointment.rescheduleAppointment)
      }
      if (!contactId && responseContactId) {
        contactId = responseContactId
      }
    }
    if (contactId && crn) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      res.locals.personAppointment = await masClient.getPersonAppointment(crn, contactId)
    }
    return next()
  }
}
