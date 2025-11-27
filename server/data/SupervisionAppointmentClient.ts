import config from '../config'
import RestClient from './restClient'

import { OutlookEventRequestBody, OutlookEventResponse } from './model/OutlookEvent'
import { ESupervisionCheckInResponse } from './model/esupervision'

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

  async getOffenderCheckIn(uuid: string): Promise<ESupervisionCheckInResponse> {
    return this.get({
      path: `/offender_checkins/${uuid}`,
    })
  }
}
