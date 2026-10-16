import RestClient from './restClient'
import config from '../config'

export interface Prisoner {
  prisonerNumber?: string
  firstName?: string
  middleNames?: string
  lastName?: string
  status?: string
  legalStatus?: string
  lastMovementTypeCode?: string
  lastMovementReasonCode?: string
  lastMovementDate?: string
  inOutStatus?: string
  prisonId?: string
  prisonName?: string
  lastPrisonId?: string
  recall?: boolean
  releaseDate?: string
}

export default class PrisonerSearchApiClient extends RestClient {
  constructor(token: string) {
    super('Prisoner Search API', config.apis.prisonerSearchApi, token)
  }

  async getPrisonerDetails(nomsNumber: string): Promise<Prisoner> {
    return this.get({
      path: `/prisoner/${nomsNumber}`,
      handle404: true,
      handle500: true,
      errorMessage: 'Tier information is currently unavailable.',
    })
  }
}
