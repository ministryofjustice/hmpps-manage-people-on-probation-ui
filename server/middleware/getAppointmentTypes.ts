import { AppointmentType, AppointmentTypeResponse } from '../models/Appointments'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'

export const getAppointmentTypes = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    let appointmentTypes: AppointmentType[] = []
    if (!req?.session?.data?.appointmentTypes) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const response: AppointmentTypeResponse = await masClient.getAppointmentTypes()
      appointmentTypes = response.appointmentTypes
      req.session.data = {
        ...(req?.session?.data ?? {}),
        appointmentTypes: [...(req?.session?.data?.appointmentTypes ?? []), ...appointmentTypes],
      }
    } else {
      appointmentTypes = req.session.data.appointmentTypes
    }
    res.locals.appointmentTypes = appointmentTypes
    return next()
  }
}
