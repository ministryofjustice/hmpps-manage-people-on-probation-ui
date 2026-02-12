import MasApiClient from '../data/masApiClient'
import { getDataValue, dateTime, handleQuotes, fullName } from '../utils'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import {
  AppointmentRequestBody,
  AppointmentSession,
  AppointmentsPostResponse,
  AppointmentType,
} from '../models/Appointments'
import SupervisionAppointmentClient from '../data/SupervisionAppointmentClient'
import { OutlookEventRequestBody, OutlookEventResponse } from '../data/model/OutlookEvent'
import config from '../config'
import { Name } from '../data/model/personalDetails'
import { getDurationInMinutes } from '../utils/getDurationInMinutes'

export const postAppointments = (hmppsAuthClient: HmppsAuthClient): Route<Promise<AppointmentsPostResponse>> => {
  return async (req, res) => {
    const { crn, id: uuid } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const masOutlookClient = new SupervisionAppointmentClient(token)
    const { data } = req.session
    const {
      user: { username, locationCode, teamCode },
      type,
      date,
      start,
      end,
      eventId,
      requirementId = '',
      licenceConditionId = '',
      nsiId = '',
      notes,
      sensitivity,
      visorReport,
      outcomeRecorded,
      smsOptIn,
    } = getDataValue<AppointmentSession>(data, ['appointments', crn, uuid])
    const body: AppointmentRequestBody = {
      user: {
        username,
        teamCode,
        locationCode: locationCode !== 'NO_LOCATION_REQUIRED' ? locationCode : null,
      },
      type,
      start: dateTime(date, start),
      end: dateTime(date, end),
      uuid,
      notes: handleQuotes(notes),
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
    if (outcomeRecorded) {
      body.outcomeRecorded = outcomeRecorded === 'Yes'
    }
    if (nsiId) {
      body.nsiId = parseInt(nsiId as string, 10)
    }

    const response = await masClient.postAppointments(crn, body)
    const userDetails = await masClient.getUserDetails(username)
    let outlookEventResponse: OutlookEventResponse

    if (userDetails?.email) {
      const appointmentId = response.appointments[0].id
      const message: string = buildCaseLink(config.domain, crn, appointmentId.toString())
      const appointmentTypes: AppointmentType[] = getDataValue<AppointmentType[]>(data, ['appointmentTypes'])
      const apptDescription = appointmentTypes.find(entry => entry.code === type).description
      const subject: string = `${apptDescription} with ${fullName(getDataValue<Name>(data, ['personalDetails', crn, 'overview', 'name']))}`
      const outlookEventRequestBody: OutlookEventRequestBody = {
        recipients: [
          {
            emailAddress: userDetails.email,
            name: `${userDetails.firstName} ${userDetails.surname}`,
          },
        ],
        message,
        subject,
        start: dateTime(date, start).toISOString(),
        durationInMinutes: getDurationInMinutes(body.start, body.end),
        supervisionAppointmentUrn: response.appointments[0].externalReference,
      }
      if (smsOptIn?.includes('YES')) {
        outlookEventRequestBody.smsEventRequest = {
          firstName: userDetails.firstName,
          mobileNumber: getDataValue<string>(data, ['personalDetails', crn, 'overview', 'mobileNumber']) || '',
          crn,
          smsOptIn: true,
        }
      }
      outlookEventResponse = await masOutlookClient.postOutlookCalendarEvent(outlookEventRequestBody)
    }
    // Setting isOutLookEventFailed to display error based on API responses.
    if (!userDetails?.email || !outlookEventResponse?.id) data.isOutLookEventFailed = true

    return response
  }
}

export const buildCaseLink = (baseUrl: string, crn: string, appointmentId: string): string =>
  `<a href="${baseUrl}/case/${crn}/appointments/appointment/${appointmentId}/manage?back=/case/${crn}/appointments" target="_blank" rel="external noopener noreferrer">View the appointment on Manage people on probation (opens in new tab).</a>`
