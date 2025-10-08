import config from '../config'
import RestClient from './restClient'
import { UserSearch } from '../models/User'

export default class ProbationSupervisionAppointmentsApiClient extends RestClient {
  constructor(token: string) {
    super('Probation Supervision Appointments API', config.apis.probationSupervisionAppointmentsApi, token)
  }

  async getUsersSearch(crn: string): Promise<UserSearch[]> {
    return this.get({
      path: `/users/search`,
      handle404: false,
      handle500: true,
      errorMessageFor500:
        'The probation supervision appointments service is experiencing technical difficulties. It has not been possible to provide sentence plan information',
    })
  }
}
