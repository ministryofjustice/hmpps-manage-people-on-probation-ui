/* eslint-disable import/no-cycle */
import RestClient from './restClient'
import config from '../config'

export default class TierApiClient extends RestClient {
  constructor(token: string) {
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

export type CalculationRule =
  | 'NO_MANDATE_FOR_CHANGE'
  | 'NO_VALID_ASSESSMENT'
  | 'NEEDS'
  | 'OGRS'
  | 'IOM'
  | 'RSR'
  | 'ROSH'
  | 'MAPPA'
  | 'COMPLEXITY'
  | 'ADDITIONAL_FACTORS_FOR_WOMEN'

export interface TierCalculation {
  tierScore: string
  calculationId: string
  calculationDate: string
  data: {
    protect: TierLevel
    change: TierLevel
    calculationVersion: string
  }
}

export interface TierLevel {
  tier: string
  points: number
  pointsBreakdown: Record<CalculationRule, number>
}

export interface TierCount {
  protectLevel: string
  changeLevel: number
  count: number
}
