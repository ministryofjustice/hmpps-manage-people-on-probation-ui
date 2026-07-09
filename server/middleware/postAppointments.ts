import * as Sentry from '@sentry/node'
import MasApiClient from '../data/masApiClient'
import { getDataValue, dateTime, handleQuotes, firstInitialLastName, toSentenceCase, isoFromDateTime } from '../utils'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import {
  AppointmentRequestBody,
  AppointmentSession,
  AppointmentsPostResponse,
  AppointmentType,
} from '../models/Appointments'
import SupervisionAppointmentClient from '../data/SupervisionAppointmentClient'
import { OutlookEventRequestBody, OutlookEventResponse, SmsPreviewRequest } from '../data/model/OutlookEvent'
import config from '../config'
import { Name } from '../data/model/personalDetails'
import { getDurationInMinutes } from '../utils/getDurationInMinutes'
import logger from '../../logger'

export const postAppointments = (hmppsAuthClient: HmppsAuthClient): Route<Promise<AppointmentsPostResponse>> => {
  return async (req, res) => {
    const { crn, id: uuid } = req.params as Record<string, string>
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
      outcome,
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

    if (res.locals.flags?.enableNonCompliance) {
      body.outcomeRecorded = !!outcome?.outcomeCode
    } else {
      body.outcomeRecorded = outcomeRecorded === 'Yes'
    }

    if (nsiId) {
      body.nsiId = parseInt(nsiId as string, 10)
    }
    const response = await masClient.postAppointments(crn, body)
    let email: string | undefined
    let name: Name
    let firstName: string
    let surname: string
    if (res.locals.flags.enableMAN2344) {
      ;({
        user: { name, email },
      } = getDataValue<AppointmentSession>(data, ['appointments', crn, uuid]))
      ;({ forename: firstName, surname } = name)

      if (!email) {
        try {
          email = (await masClient.getUserDetails(username))?.email
        } catch (error) {
          logger.warn(error, `Appointment ${uuid}: failed to retrieve user details for ${username}`)
        }
      }

      const bookingUserEmail = res.locals.user.email
      const isDifferentUser = Boolean(email) && Boolean(bookingUserEmail) && email !== bookingUserEmail
      if (isDifferentUser) {
        logger.info(`Appointment ${uuid}: attending user is different to booking user.`)
      }
    } else {
      ;({ email, firstName, surname } = res.locals.user)
    }
    let outlookEventResponse: OutlookEventResponse
    let isWelshTranslation: boolean = false
    if (email) {
      const appointmentId = response.appointments[0].id
      const message: string = buildCaseLink(config.domain, crn, appointmentId.toString())
      const appointmentTypes: AppointmentType[] = getDataValue<AppointmentType[]>(data, ['appointmentTypes'])
      const apptDescription = appointmentTypes.find(entry => entry.code === type).description
      const subject: string = `${firstInitialLastName(getDataValue<Name>(data, ['personalDetails', crn, 'overview', 'name']))}: ${toSentenceCase(apptDescription, [], null, false, true)}`
      const outlookEventRequestBody: OutlookEventRequestBody = {
        recipients: [
          {
            emailAddress: email,
            name: `${firstName} ${surname}`,
          },
        ],
        message,
        subject,
        start: isoFromDateTime(date, start),
        durationInMinutes: getDurationInMinutes(body.start, body.end),
        supervisionAppointmentUrn: response.appointments[0].externalReference,
      }
      const { mobileNumber } = res.locals.case

      if (smsOptIn?.includes('YES') && res.locals.flags.enableSmsReminders && mobileNumber) {
        const {
          includeWelshPreview,
          appointmentLocation = null,
          appointmentTypeCode = null,
        } = getDataValue<SmsPreviewRequest>(data, ['appointments', crn, uuid, 'smsPreview', 'request'])
        isWelshTranslation = includeWelshPreview
        outlookEventRequestBody.smsEventRequest = {
          firstName: getDataValue<Name>(data, ['personalDetails', crn, 'overview', 'name']).forename,
          mobileNumber,
          crn,
          smsOptIn: true,
          includeWelshTranslation: includeWelshPreview,
        }
        if (appointmentLocation) outlookEventRequestBody.smsEventRequest.appointmentLocation = appointmentLocation
        if (appointmentTypeCode) outlookEventRequestBody.smsEventRequest.appointmentTypeCode = appointmentTypeCode
      }
      outlookEventResponse = await masOutlookClient.postOutlookCalendarEvent(outlookEventRequestBody)
      const eventResponse: any = outlookEventResponse
      if (eventResponse?.status === 500) {
        const sentryError =
          eventResponse?.error ??
          new Error(eventResponse?.errors?.[0]?.text ?? 'Calendar event creation not successful.')
        const sentryEventId = Sentry.captureException(sentryError, {
          tags: {
            'http.status': '500',
            'error.type': 'internal_server_error',
            service: 'Probation Supervision Appointments Api',
            operation: 'postOutlookCalendarEvent',
          },
        })
        logger.info(`Sentry eventId: ${sentryEventId}`)
        logger.warn(
          { sentryEventId, apiError: eventResponse?.error, apiErrors: eventResponse?.errors },
          'Failed to create calendar event',
        )
      }
    }
    // Setting isOutLookEventFailed to display error based on API responses.
    if (!email || !outlookEventResponse?.id) data.isOutLookEventFailed = true

    if (smsOptIn?.includes('YES') && !outlookEventResponse?.smsResponse?.englishNotificationId)
      data.isEnglishNotificationFailed = true

    if (smsOptIn?.includes('YES') && isWelshTranslation && !outlookEventResponse?.smsResponse?.welshNotificationId)
      data.isWelshNotificationFailed = true

    return response
  }
}

export const buildCaseLink = (baseUrl: string, crn: string, appointmentId: string): string =>
  `<a href="${baseUrl}/case/${crn}/appointments/appointment/${appointmentId}/manage?back=/case/${crn}/appointments" target="_blank" rel="external noopener noreferrer">View the appointment on Manage people on probation (opens in new tab).</a>`
