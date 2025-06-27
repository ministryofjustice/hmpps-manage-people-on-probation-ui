import MasApiClient from '../data/masApiClient'
import { getDataValue, dateTime } from '../utils'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import { AppointmentRequestBody, AppointmentSession } from '../models/Appointments'

export const postAppointments = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, id: uuid } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const { data } = req.session
    const {
      user: { username, locationCode, teamCode },
      type,
      date,
      start,
      end,
      interval,
      numberOfAppointments,
      eventId,
      requirementId = '',
      licenceConditionId = '',
      nsiId = '',
      until: repeatUntilDate = '',
      notes,
      sensitivity,
      visorReport,
    } = getDataValue<AppointmentSession>(data, ['appointments', crn, uuid])
    const until = repeatUntilDate || date
    const body: AppointmentRequestBody = {
      user: {
        username,
        teamCode,
        locationCode: locationCode !== 'I do not need to pick a location' ? locationCode : '',
      },
      type,
      start: dateTime(date, start),
      end: dateTime(date, end),
      interval,
      numberOfAppointments: parseInt(numberOfAppointments, 10),
      eventId: parseInt(eventId, 10),
      uuid,
      createOverlappingAppointment: true,
      until: dateTime(until, end),
      notes,
      sensitive: sensitivity === 'Yes',
      visorReport: visorReport === 'Yes',
    }
    if (requirementId) {
      body.requirementId = parseInt(requirementId as string, 10)
    }
    if (licenceConditionId) {
      body.licenceConditionId = parseInt(licenceConditionId as string, 10)
    }
    if (nsiId) {
      body.nsiId = parseInt(nsiId as string, 10)
    }
    console.dir(body, { depth: null })
    await masClient.postAppointments(crn, body)
    return next()
  }
}
