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
      user: { username, teamCode, locationCode },
      type,
      date,
      start,
      end,
      interval,
      numberOfAppointments = 0,
      eventId,
      requirementId = 0,
      licenceConditionId = 0,
      nsiId = 0,
    } = getDataValue(data, ['appointments', crn, uuid])

    const body: AppointmentRequestBody = {
      user: {
        username,
        teamCode,
        locationCode,
      },
      type,
      start: dateTime(date, start),
      end: dateTime(date, end),
      interval,
      numberOfAppointments: parseInt(numberOfAppointments, 10),
      eventId,
      uuid,
      createOverlappingAppointment: true,
      requirementId,
      licenceConditionId,
      nsiId,
      until: '',
    }
    await masClient.postAppointments(crn, body)
    return next()
  }
}
