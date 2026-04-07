import { DateTime } from 'luxon'
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
import { EventResponse, RescheduleEventRequest } from '../data/model/OutlookEvent'
import { appointmentDateIsInPast } from './appointmentDateIsInPast'
import { PersonAppointment } from '../data/model/schedule'
import { buildCaseLink } from './postAppointments'
import config from '../config'
import { Name } from '../data/model/personalDetails'

export const postRescheduleAppointments = (
  hmppsAuthClient: HmppsAuthClient,
): Route<Promise<RescheduleAppointmentResponse | PersonAppointment>> => {
  return async (req, res) => {
    const { crn, id: uuid, contactId } = req.params as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const masOutlookClient = new SupervisionAppointmentClient(token)
    const { externalReference: oldSupervisionAppointmentUrn } = res.locals.personAppointment.appointment

    const { data } = req.session
    const { date, start, end, type, notes, sensitivity, visorReport, rescheduleAppointment, outcomeRecorded } =
      getDataValue<AppointmentSession>(data, ['appointments', crn, uuid])
    const selectedTeam = getDataValue(data, ['appointments', crn, uuid, 'user', 'teamCode'])
    const selectedLocation = getDataValue(data, ['appointments', crn, uuid, 'user', 'locationCode'])
    const staffCode = getDataValue(data, ['appointments', crn, uuid, 'user', 'staffCode'])
    const isInPast = appointmentDateIsInPast(req)
    const body: RescheduleAppointmentRequestBody = {
      date,
      startTime: start,
      endTime: end,
      staffCode,
      teamCode: selectedTeam,
      locationCode: selectedLocation,
      outcomeRecorded: outcomeRecorded === 'Yes',
      notes: handleQuotes(notes),
      sensitive: sensitivity === 'Yes',
      sendToVisor: visorReport === 'Yes',
      requestedBy: rescheduleAppointment.whoNeedsToReschedule,
      reasonIsSensitive: rescheduleAppointment.sensitivity === 'Yes',
      uuid,
      isInFuture: isInPast === false,
    }
    if (rescheduleAppointment?.reason) {
      body.reasonForRecreate = handleQuotes(rescheduleAppointment.reason)
    }
    const response = await masClient.putRescheduleAppointment(contactId, body)
    const { firstName, surname, email } = res.locals.user
    let eventResponse: EventResponse
    if (email && res.locals.flags.enableCalendarEvents) {
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
      eventResponse = await masOutlookClient.postRescheduleAppointmentEvent(rescheduleEventRequest)
    }

    // Setting isOutLookEventFailed to display error based on API responses.
    if (!email || (!isInPast && !eventResponse?.id)) data.isOutLookEventFailed = true

    return response
  }
}
