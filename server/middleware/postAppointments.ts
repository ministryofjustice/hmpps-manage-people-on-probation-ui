import MasApiClient from '../data/masApiClient'
import { getDataValue, dateTime } from '../utils'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import { AppointmentRequestBody } from '../models/Appointments'

export const postAppointments = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, id: uuid } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const { data } = req.session
    const {
      user: { locationCode },
      username,
      team,
      type,
      date,
      start,
      end,
      interval,
      numberOfAppointments,
      eventId,
      requirementId,
      licenceConditionId,
      nsiId,
      notes,
      sensitvity,
    } = getDataValue(data, ['appointments', crn, uuid])
    const body: AppointmentRequestBody = {
      user: {
        username,
        teamCode: team,
        locationCode,
      },
      type,
      start: dateTime(date, start),
      end: dateTime(date, end),
      interval,
      numberOfAppointments: parseInt(numberOfAppointments, 10),
      eventNumber,
      uuid,
      createOverlappingAppointment: true,
      requirementId,
      licenceConditionId,
      nsiId,
      notes,
      sensitive: sensitvity === 'Yes',
    }
    await masClient.postAppointments(crn, body)
    return next()
  }
}
