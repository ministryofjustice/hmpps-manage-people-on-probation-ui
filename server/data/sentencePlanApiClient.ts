import config from '../config'

import RestClient from './restClient'
import { ErrorSummary } from './model/common'
import { Needs, RiskScoresDto, RiskSummary } from './model/risk'

export default class SentencePlanApiClient extends RestClient {
  constructor(token: string) {
    super('Sentence Plan API', config.apis.sentencePlanApi, token)
  }

  async getPlanByCrn(crn: string): Promise<RiskSummary | ErrorSummary | null> {
    return this.get({
      path: `/plans/crn/${crn}`,
      handle404: true,
      handle500: true,
      errorMessageFor500:
        'The sentence plan service is experiencing technical difficulties. It has not been possible to provide sentence plan information',
    })
  }
}
