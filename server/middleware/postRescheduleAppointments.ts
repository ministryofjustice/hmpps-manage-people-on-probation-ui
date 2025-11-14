import MasApiClient from '../data/masApiClient'
import { getDataValue, dateTime, handleQuotes, fullName, setDataValue } from '../utils'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import {
  AppointmentSession,
  RescheduleAppointmentRequestBody,
  RescheduleAppointmentResponse,
} from '../models/Appointments'
import SupervisionAppointmentClient from '../data/SupervisionAppointmentClient'
import { EventResponse, RescheduleEventRequest } from '../data/model/OutlookEvent'

import FlagService from '../services/flagService'
import { FeatureFlags } from '../data/model/featureFlags'

export const postRescheduleAppointments = (
  hmppsAuthClient: HmppsAuthClient,
): Route<Promise<RescheduleAppointmentResponse>> => {
  return async (req, res) => {
    const { crn, id: uuid, contactId } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const masOutlookClient = new SupervisionAppointmentClient(token)
    const { data } = req.session
    const { date, start, end, notes, sensitivity, visorReport, rescheduleAppointment } =
      getDataValue<AppointmentSession>(data, ['appointments', crn, uuid])
    const selectedTeam = getDataValue(data, ['appointments', crn, uuid, 'user', 'teamCode'])
    const selectedLocation = getDataValue(data, ['appointments', crn, uuid, 'user', 'locationCode'])
    const staffCode = getDataValue(data, ['appointments', crn, uuid, 'user', 'staffCode'])
    const body: RescheduleAppointmentRequestBody = {
      date,
      startTime: start,
      endTime: end,
      uuid,
      staffCode,
      teamCode: selectedTeam,
      locationCode: selectedLocation,
      requestedBy: rescheduleAppointment.whoNeedsToReschedule,
      // rescheduleNotes: handleQuotes(rescheduleAppointment.reason),
      //  rescheduleSensitive: rescheduleAppointment.sensitivity === 'Yes',
      notes: handleQuotes(notes),
      sensitive: sensitivity === 'Yes',
      sendToVisor: visorReport === 'Yes',
    }
    console.log(body)
    const response = await masClient.putRescheduleAppointment(contactId, body)
    console.dir(response, { depth: null })

    /*
        const userDetails = await masClient.getUserDetails(username)
        let eventResponse: EventResponse
        const flagService = new FlagService()
        const featureFlags: FeatureFlags = await flagService.getFlags()
       if (featureFlags.enableOutlookEvent && userDetails?.email) {
          const rescheduleEventRequest: RescheduleEventRequest = {
            rescheduledEventRequest: {
              emailAddress: userDetails.email,
              name: `${userDetails.firstName} ${userDetails.surname}`,
            },
            oldSupervisionAppointmentUrn: response.externalReference,
          }
          eventResponse = await masOutlookClient.postRescheduleAppointmentEvent(rescheduleEventRequest)
        } */
    // Setting isOutLookEventFailed to display error based on API responses.
    // if (featureFlags.enableOutlookEvent && (!userDetails?.email || !eventResponse?.id)) data.isOutLookEventFailed = true

    return response
  }
}

const buildCaseLink = (baseUrl: string, crn: string, appointmentId: string) =>
  `<a href=${baseUrl}/case/${crn}/appointments/appointment/${appointmentId}/manage?back=/case/${crn}/appointments target='_blank' rel="external noopener noreferrer"> View the appointment on Manage people on probation (opens in new tab).</a>`
