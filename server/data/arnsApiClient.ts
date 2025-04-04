import config from '../config'

import RestClient from './restClient'
import { ErrorSummary, ErrorSummaryItem } from './model/common'
import { RiskScoresDto } from './model/risk'

export default class ArnsApiClient extends RestClient {
  constructor(token: string) {
    super('Assess Risks and Needs API', config.apis.arnsApi, token)
  }

  async getRisks(crn: string): Promise<RiskSummary | ErrorSummary | null> {
    return this.get({
      path: `/risks/crn/${crn}`,
      handle404: true,
      handle500: true,
      errorMessageFor500:
        'OASys is experiencing technical difficulties. It has not been possible to provide the Risk information held in OASys',
    })
  }

  async getNeeds(crn: string): Promise<Needs | ErrorSummary | null> {
    return this.get({
      path: `/needs/crn/${crn}`,
      handle404: true,
      handle500: true,
      errorMessageFor500:
        'OASys is experiencing technical difficulties. It has not been possible to provide the Criminogenic needs information held in OASys',
    })
  }

  async getPredictorsAll(crn: string): Promise<RiskScoresDto[] | ErrorSummary | null> {
    return this.get({
      path: `/risks/crn/${crn}/predictors/all`,
      handle404: true,
      handle500: true,
      errorMessageFor500:
        'OASys is experiencing technical difficulties. It has not been possible to provide the predictor score information held in OASys',
    })
  }
}

export type RiskScore = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'

export type RiskResponse = 'YES' | 'NO' | 'DK'

export interface Risk {
  [index: string]: string
  risk: RiskResponse | null
  current: RiskResponse | null
  currentConcernsText: string | null
  previous?: RiskResponse | null
  previousConcernsText?: string | null
}

export interface RiskToSelf {
  [index: string]: Risk
  suicide?: Risk | null
  selfHarm?: Risk | null
  custody?: Risk | null
  hostelSetting?: Risk | null
  vulnerability?: Risk | null
}

export interface RiskSummary {
  errors?: ErrorSummaryItem[]
  riskToSelf?: RiskToSelf
  summary?: {
    whoIsAtRisk?: string | null
    natureOfRisk?: string | null
    riskImminence?: string | null
    riskIncreaseFactors?: string | null
    riskMitigationFactors?: string | null
    riskInCommunity?: Partial<Record<RiskScore, string[]>>
    riskInCustody?: Partial<Record<RiskScore, string[]>>
    overallRiskLevel: RiskScore
  }
  assessedOn?: string | null
}

export interface Needs {
  identifiedNeeds: Need[]
}

export interface Need {
  section: string
  name: string
  riskOfHarm: boolean
  riskOfReoffending: boolean
  severity: string
}
