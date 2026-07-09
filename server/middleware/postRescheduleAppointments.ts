import { DateTime } from 'luxon'
import * as Sentry from '@sentry/node'
import MasApiClient from '../data/masApiClient'
import { firstInitialLastName, getDataValue, handleQuotes, toSentenceCase } from '../utils'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import {
  AppointmentSession,
  AppointmentType,
  RescheduleAppointmentRequestBody,
  RescheduleAppointmentResponse,
} from '../models/Appointments'
import SupervisionAppointmentClient from '../data/SupervisionAppointmentClient'
import { EventResponse, RescheduleEventRequest, SmsPreviewRequest } from '../data/model/OutlookEvent'
import { appointmentDateIsInPast } from './appointmentDateIsInPast'
import { buildCaseLink } from './postAppointments'
import config from '../config'
import { Name } from '../data/model/personalDetails'
import logger from '../../logger'

export const postRescheduleAppointments = (
  hmppsAuthClient: HmppsAuthClient,
): Route<Promise<RescheduleAppointmentResponse>> => {
  return async (req, res) => {
    const { crn, id: uuid } = req.params as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const masOutlookClient = new SupervisionAppointmentClient(token)
    const { externalReference: oldSupervisionAppointmentUrn } = res.locals.personAppointment.appointment

    const { data } = req.session
    const {
      date,
      start,
      end,
      type,
      notes,
      sensitivity,
      visorReport,
      rescheduleAppointment,
      outcomeRecorded,
      smsOptIn,
      outcome,
      user: { teamCode: selectedTeam, locationCode: selectedLocation, staffCode },
    } = getDataValue<AppointmentSession>(data, ['appointments', crn, uuid])

    const isInPast = appointmentDateIsInPast(req)
    const { contactId } = rescheduleAppointment
    const body: RescheduleAppointmentRequestBody = {
      date,
      startTime: start,
      endTime: end,
      staffCode,
      teamCode: selectedTeam,
      locationCode: selectedLocation,
      notes: handleQuotes(notes),
      sensitive: sensitivity === 'Yes',
      sendToVisor: visorReport === 'Yes',
      requestedBy: rescheduleAppointment.whoNeedsToReschedule,
      reasonIsSensitive: rescheduleAppointment.sensitivity === 'Yes',
      uuid,
      isInFuture: isInPast === false,
    }
    if (res.locals.flags?.enableNonCompliance) {
      body.outcomeRecorded = !!outcome?.outcomeCode
    } else {
      body.outcomeRecorded = outcomeRecorded === 'Yes'
    }
    if (rescheduleAppointment?.reason) {
      body.reasonForRecreate = handleQuotes(rescheduleAppointment.reason)
    }
    const response = await masClient.putRescheduleAppointment(contactId, body)
    const { firstName, surname, email } = res.locals.user
    let eventResponse: EventResponse
    let isWelshTranslation: boolean = false
    if (email) {
      const startTime = DateTime.fromISO(start)
      const endTime = DateTime.fromISO(end)
      const dt = DateTime.fromISO(`${date}T${start}`)
      const startDateTime = dt.toISO()
      const durationInMinutes = endTime.diff(startTime, 'minutes').minutes
      const appointmentTypes: AppointmentType[] = getDataValue<AppointmentType[]>(data, ['appointmentTypes'])
      const apptDescription = appointmentTypes.find(entry => entry.code === type).description
      const message = buildCaseLink(config.domain, crn, contactId.toString())
      const subject: string = `${firstInitialLastName(getDataValue<Name>(data, ['personalDetails', crn, 'overview', 'name']))}: ${toSentenceCase(apptDescription, [], null, false, true)}`
      const rescheduleEventRequest: RescheduleEventRequest = {
        rescheduledEventRequest: {
          recipients: [
            {
              emailAddress: email,
              name: `${firstName} ${surname}`,
            },
          ],
          message,
          subject,
          start: startDateTime,
          durationInMinutes,
          supervisionAppointmentUrn: response.externalReference,
        },
        oldSupervisionAppointmentUrn,
      }
      const { mobileNumber } = res.locals.case

      if (smsOptIn?.includes('YES') && res.locals.flags.enableSmsReminders && mobileNumber) {
        const {
          includeWelshPreview,
          appointmentLocation = null,
          appointmentTypeCode = null,
        } = getDataValue<SmsPreviewRequest>(data, ['appointments', crn, uuid, 'smsPreview', 'request'])
        isWelshTranslation = includeWelshPreview
        rescheduleEventRequest.rescheduledEventRequest.smsEventRequest = {
          firstName: getDataValue<Name>(data, ['personalDetails', crn, 'overview', 'name']).forename,
          mobileNumber,
          crn,
          smsOptIn: true,
          includeWelshTranslation: includeWelshPreview,
        }
        if (appointmentLocation)
          rescheduleEventRequest.rescheduledEventRequest.smsEventRequest.appointmentLocation = appointmentLocation
        if (appointmentTypeCode)
          rescheduleEventRequest.rescheduledEventRequest.smsEventRequest.appointmentTypeCode = appointmentTypeCode
      }

      eventResponse = await masOutlookClient.postRescheduleAppointmentEvent(rescheduleEventRequest)
      const outlookEventResponse: any = eventResponse
      if (outlookEventResponse?.status === 500) {
        const sentryError =
          outlookEventResponse?.error ??
          new Error(outlookEventResponse?.errors?.[0]?.text ?? 'Rescheduling appointment event not successful.')
        const sentryEventId = Sentry.captureException(sentryError, {
          tags: {
            'http.status': '500',
            'error.type': 'internal_server_error',
            service: 'Probation Supervision Appointments Api',
            operation: 'postRescheduleAppointmentEvent',
          },
        })
        logger.info(`Sentry eventId: ${sentryEventId}`)
        logger.warn(
          { sentryEventId, apiError: outlookEventResponse?.error, apiErrors: outlookEventResponse?.errors },
          'Failed to create rescheduling calendar event',
        )
      }
    }

    // Setting isOutLookEventFailed to display error based on API responses.
    if (!email || (!isInPast && !eventResponse?.id)) data.isOutLookEventFailed = true
    if (smsOptIn?.includes('YES') && !eventResponse?.smsResponse?.englishNotificationId)
      data.isEnglishNotificationFailed = true

    if (smsOptIn?.includes('YES') && isWelshTranslation && !eventResponse?.smsResponse?.welshNotificationId)
      data.isWelshNotificationFailed = true

    return response
  }
}
