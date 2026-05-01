import config from '../config'
import RestClient from './restClient'

import {
  EventResponse,
  OutlookEventRequestBody,
  OutlookEventResponse,
  RescheduleEventRequest,
  SmsPreviewRequest,
  SmsPreviewResponse,
} from './model/OutlookEvent'
import { ErrorSummary } from './model/common'

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

  async postSmsPreview(body: SmsPreviewRequest): Promise<SmsPreviewResponse | ErrorSummary | null> {
    return this.post({
      data: body,
      path: `/sms/preview`,
      handle404: true,
      handle500: true,
    })
  }
}
