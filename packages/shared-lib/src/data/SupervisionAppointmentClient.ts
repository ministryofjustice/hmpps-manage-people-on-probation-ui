import { getConfig } from '../config'
import RestClient from './restClient'
import {
  EventResponse,
  OutlookEventRequestBody,
  OutlookEventResponse,
  RescheduleEventRequest,
} from './model/OutlookEvent'

export default class SupervisionAppointmentClient extends RestClient {
  constructor(token: string) {
    const config = getConfig()
    super('HMPPS Probation Supervision Appointments API', config.apis.masAppointmentsApi, token)
  }

  async postOutlookCalendarEvent(body: OutlookEventRequestBody): Promise<OutlookEventResponse> {
    return this.post({
      data: body,
      path: `/calendar/event`,
      handle404: false,
      handle500: true,
      errorMessage: 'Calendar event creation not successful',
    })
  }

  async postRescheduleAppointmentEvent(body: RescheduleEventRequest): Promise<EventResponse> {
    return this.post({
      data: body,
      path: `/calendar/event/reschedule`,
      handle404: false,
      handle500: true,
      errorMessage: 'Rescheduling appointment not successful',
    })
  }
}
