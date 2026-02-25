import { getConfig } from '../config'
import RestClient from './restClient'
import { ErrorSummary } from './model/common'
import { Needs, RiskScoresDto, RiskSummary } from './model/risk'
import { SanIndicatorResponse } from '../models/Risk'
import { apiErrors } from '../properties'

export default class ArnsApiClient extends RestClient {
  constructor(token: string) {
    const config = getConfig()
    super('Assess Risks and Needs API', config.apis.arnsApi, token)
  }

  async getRisks(crn: string): Promise<RiskSummary | ErrorSummary | null> {
    return this.get({
      path: `/risks/crn/${crn}`,
      handle404: true,
      handle500: true,
      handle401: true,
      errorMessage: apiErrors.risks,
    })
  }

  async getNeeds(crn: string): Promise<Needs | ErrorSummary | null> {
    return this.get({
      path: `/needs/crn/${crn}`,
      handle404: true,
      handle500: true,
      handle401: true,
      errorMessage:
        'OASys is experiencing technical difficulties. It has not been possible to provide the Criminogenic needs information held in OASys',
    })
  }

  async getSanIndicator(crn: string): Promise<SanIndicatorResponse> {
    return this.get({
      path: `/san-indicator/crn/${crn}`,
      handle404: true,
      handle500: true,
      handle401: true,
      errorMessage:
        'OASys is experiencing technical difficulties. It has not been possible to provide the Risk information held in OASys',
    })
  }

  async getPredictorsAll(crn: string): Promise<RiskScoresDto[] | ErrorSummary | null> {
    return this.get({
      path: `/risks/crn/${crn}/predictors/all`,
      handle404: true,
      handle500: true,
      handle401: true,
      errorMessage:
        'OASys is experiencing technical difficulties. It has not been possible to provide the predictor score information held in OASys',
    })
  }
}
