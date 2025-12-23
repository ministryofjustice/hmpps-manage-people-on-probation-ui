import RestClient from './restClient'
import config from '../config'
import { Interventions } from './model/interventions'

export default class InterventionsApiClient extends RestClient {
  constructor(token: string) {
    super('Interventions API', config.apis.interventionsApi, token)
  }

  async getInterventions(crn: string): Promise<Interventions> {
    return this.get({
      path: `/probation-case/${crn}/referral`,
      handle404: true,
      handle500: true,
      errorMessage:
        'The interventions service is experiencing technical difficulties. It has not been possible to provide intervention information',
    })
  }
}
