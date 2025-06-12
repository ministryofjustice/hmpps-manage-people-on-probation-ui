import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { AppointmentLocals } from '../models/Locals'
import { getDataValue } from '../utils'

export const getAppointment = (hmppsAuthClient: HmppsAuthClient): Route<void> => {
  return async (req, res, next) => {
    const { crn, id } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const currentCase = await masClient.getOverview(crn)
    const { forename } = currentCase.personalDetails.name
    const { data } = req.session
    const selectedType = getDataValue(data, ['appointments', crn, id, 'type'])
    const type = res.locals.appointment.types.find(t => t.code === selectedType)
    let appointment: AppointmentLocals = {
      visor: currentCase.registrations.map(reg => reg.toLowerCase()).includes('visor'),
      forename,
      type,
      change: (req?.query?.change as string) || null,
    }
    if (req.session?.data?.appointments?.[crn]?.[id]) {
      appointment = {
        ...req.session.data.appointments[crn][id],
        ...appointment,
      }
    }
    res.locals.appointment = { ...(res?.locals?.appointment || {}), ...appointment }
    return next()
  }
}
