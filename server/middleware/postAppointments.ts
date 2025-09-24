/* eslint-disable import/no-extraneous-dependencies */
import { Response } from 'supertest'
import MasApiClient from '../data/masApiClient'
import { getDataValue, dateTime, escapeQuotes } from '../utils'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import { AppointmentRequestBody, AppointmentSession } from '../models/Appointments'

export const postAppointments = (hmppsAuthClient: HmppsAuthClient): Route<Promise<Response>> => {
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
      until: untilDate,
      visorReport,
    } = getDataValue<AppointmentSession>(data, ['appointments', crn, uuid])
    const body: AppointmentRequestBody = {
      user: {
        username,
        teamCode,
        locationCode: locationCode !== 'NO_LOCATION_REQUIRED' ? locationCode : '',
      },
      type,
      start: dateTime(date, start),
      end: dateTime(date, end),
      interval,
      numberOfAppointments: parseInt(numberOfAppointments, 10),
      uuid,
      createOverlappingAppointment: true,
      until: dateTime(untilDate, end),
      notes: escapeQuotes(notes),
      sensitive: sensitivity === 'Yes',
      visorReport: visorReport === 'Yes',
    }
    if (eventId !== 'PERSON_LEVEL_CONTACT') {
      body.eventId = parseInt(eventId, 10)
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
    const response = await masClient.postAppointments(crn, body)
    return response
  }
}
