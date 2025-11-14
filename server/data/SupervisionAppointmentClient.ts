import config from '../config'
import RestClient from './restClient'

import {
  EventResponse,
  OutlookEventRequestBody,
  OutlookEventResponse,
  RescheduleEventRequest,
} from './model/OutlookEvent'

export default class SupervisionAppointmentClient extends RestClient {
  constructor(token: string) {
    super('HMPPS Probation Supervision Appointments API', config.apis.masAppointmentsApi, token)
  }

  async postOutlookCalendarEvent(body: OutlookEventRequestBody): Promise<OutlookEventResponse> {
    return this.post({
      data: body,
      path: `/calendar/event`,
      handle404: false,
      handle500: true,
      errorMessageFor500: 'Calendar event creation not successful',
    })
  }

  async postRescheduleAppointmentEvent(body: RescheduleEventRequest): Promise<EventResponse> {
    return this.post({
      data: body,
      path: `/event/reschedule`,
      handle404: false,
      handle500: true,
      errorMessageFor500: 'Rescheduling appointment not successful',
    })
  }
}
