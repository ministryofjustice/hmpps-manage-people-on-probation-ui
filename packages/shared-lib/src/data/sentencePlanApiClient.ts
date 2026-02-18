import { getConfig } from '../config'
import RestClient from './restClient'
import { SentencePlan } from './model/sentencePlan'

export default class SentencePlanApiClient extends RestClient {
  constructor(token: string) {
    const config = getConfig()
    super('Sentence Plan API', config.apis.sentencePlanApi, token)
  }

  async getPlanByCrn(crn: string): Promise<SentencePlan[]> {
    return this.get({
      path: `/plans/crn/${crn}`,
      handle404: true,
      handle500: true,
      errorMessage:
        'The sentence plan service is experiencing technical difficulties. It has not been possible to provide sentence plan information',
    })
  }
}
