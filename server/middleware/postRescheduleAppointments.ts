import { DateTime } from 'luxon'
import MasApiClient from '../data/masApiClient'
import { fullName, getDataValue, handleQuotes } from '../utils'
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
    const { crn, id: uuid, contactId } = req.params
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
      user: { username },
    } = getDataValue<AppointmentSession>(data, ['appointments', crn, uuid])
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
    const userDetails = await masClient.getUserDetails(username)
    let eventResponse: EventResponse
    if (userDetails?.email && !isInPast) {
      const startTime = DateTime.fromISO(start)
      const endTime = DateTime.fromISO(end)
      const dt = DateTime.fromISO(`${date}T${start}`)
      const startDateTime = dt.toISO()
      const durationInMinutes = endTime.diff(startTime, 'minutes').minutes
      const appointmentTypes: AppointmentType[] = getDataValue<AppointmentType[]>(data, ['appointmentTypes'])
      const apptDescription = appointmentTypes.find(entry => entry.code === type).description
      const message = buildCaseLink(config.domain, crn, contactId.toString())
      const subject = `${apptDescription} with ${fullName(getDataValue<Name>(data, ['personalDetails', crn, 'name']))}`
      const rescheduleEventRequest: RescheduleEventRequest = {
        rescheduledEventRequest: {
          recipients: [
            {
              emailAddress: userDetails.email,
              name: `${userDetails.firstName} ${userDetails.surname}`,
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
    if (!userDetails?.email || !eventResponse?.id) data.isOutLookEventFailed = true
    return response
  }
}
