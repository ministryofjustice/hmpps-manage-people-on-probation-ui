import RestClient from './restClient'
import config from '../config'
import { CurrentPhaseResponse } from './model/finalThird'

export default class SupervisionPackageApiClient extends RestClient {
  constructor(token: string) {
    super('Supervision Package API', config.apis.supervisionPackageApi, token)
  }

  async getCurrentPhase(crn: string): Promise<CurrentPhaseResponse | null> {
    return this.get({ path: `/case/${crn}/current-phase`, handle404: false })
  }
}
