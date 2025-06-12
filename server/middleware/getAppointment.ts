import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { AppointmentLocals } from '../models/Locals'

export const getAppointment = (hmppsAuthClient: HmppsAuthClient): Route<void> => {
  return async (req, res, next) => {
    const { crn, id } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const [currentCase, appointmentTypesResponse] = await Promise.all([
      masClient.getOverview(crn),
      masClient.getAppointmentTypes(),
    ])
    res.locals.appointmentTypes = appointmentTypesResponse.appointmentTypes
    res.locals.visor = currentCase.registrations.map(reg => reg.toLowerCase()).includes('visor')
    const { forename } = currentCase.personalDetails.name
    let appointment: AppointmentLocals = {
      types: appointmentTypesResponse.appointmentTypes,
      visor: currentCase.registrations.map(reg => reg.toLowerCase()).includes('visor'),
      forename,
      change: req.query.change as string,
    }
    if (req.session?.data?.appointments?.[crn]?.[id]) {
      appointment = {
        ...appointment,
        ...req.session.data.appointments[crn][id],
      }
    }
    res.locals.appointment = appointment
    return next()
  }
}
