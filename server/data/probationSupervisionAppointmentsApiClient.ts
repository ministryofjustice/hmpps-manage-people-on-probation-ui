import config from '../config'
import RestClient from './restClient'
import { UserSearch } from '../models/User'

export default class ProbationSupervisionAppointmentsApiClient extends RestClient {
  constructor(token: string) {
    super('Probation Supervision Appointments API', config.apis.probationSupervisionAppointmentsApi, token)
  }

  async getUsersSearch(query = ''): Promise<UserSearch> {
    const queryStr = query ? `?query=${query}` : ''
    return this.get({
      path: `/user/search${queryStr}`,
      handle404: false,
      handle500: true,
      errorMessageFor500:
        'The probation supervision appointments service is experiencing technical difficulties. It has not been possible to provide sentence plan information',
    })
  }
}
