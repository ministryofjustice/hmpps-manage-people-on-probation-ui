import config from '../config'
import RestClient from './restClient'

import { OutlookEventRequestBody, OutlookEventResponse } from './model/OutlookEvent'

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
}
