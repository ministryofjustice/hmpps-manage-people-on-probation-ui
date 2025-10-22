import config from '../config'

import RestClient from './restClient'
import { ErrorSummary } from './model/common'
import { Needs, RiskScoresDto, RiskSummary } from './model/risk'
import { SanIndicatorResponse } from '../models/Risk'

export default class ProbationFrontendComponentsApiClient extends RestClient {
  constructor(token: string) {
    super('Probation Frontend Components API', config.apis.probationFrontendComponentsApi, token)
  }

  async getComponents(components: string[] = ['header']): Promise<any> {
    const queryStr = `?${components.join('&')}`
    return this.get({
      path: `/components${queryStr}`,
    })
  }
}
