import RestClient from './restClient'
import { getConfig } from '../config'
import { TierCalculation } from '../types'

export default class TierApiClient extends RestClient {
  constructor(token: string) {
    const config = getConfig()
    super('Tier API', config.apis.tierApi, token)
  }

  async getCalculationDetails(crn: string): Promise<TierCalculation> {
    return this.get({
      path: `/crn/${crn}/tier/details`,
      handle404: true,
      handle500: true,
      errorMessage:
        'The tier service is experiencing technical difficulties. It has not been possible to provide tier information',
    })
  }
}
