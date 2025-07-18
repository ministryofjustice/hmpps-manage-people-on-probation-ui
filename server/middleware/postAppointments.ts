import MasApiClient from '../data/masApiClient'
import { getDataValue, dateTime } from '../utils'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import { AppointmentRequestBody, AppointmentSession } from '../models/Appointments'

export const postAppointments = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res) => {
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
      notes,
      sensitivity,
      file = null,
      until: untilDate,
      visorReport,
    } = getDataValue<AppointmentSession>(data, ['appointments', crn, uuid])
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
      until: dateTime(untilDate, end),
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
    /*
    convert back to buffer to send as raw binary
    headers would need to be set to:
    'Content-Type': 'application/octet-stream'
    */

    /*
    Alt approach here would be to post file as base64 string
    */
    await masClient.postAppointments(crn, body, file)
  }
}
