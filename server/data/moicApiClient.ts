import RestClient from './restClient'
import config from '../config'

export interface PomToRoHandoverData {
  nomsNumber: string
  handoverDate: string
  handoverStartDate: string | null
  responsibility: string
  responsibleComName: string
  responsiblePomName: string
}

export interface Staff {
  staff_id: number
  name: string
}

export interface PrisonOffenderManagerData {
  primary_pom?: Staff
  secondary_pom?: Staff
}
export default class MoicApiClient extends RestClient {
  constructor(token: string) {
    super('Managing Offenders in Custody Api', config.apis.moicApi, token)
  }

  async getPomToRoHandoverDetails(nomsNumber: string): Promise<PomToRoHandoverData> {
    return this.get({
      path: `/api/handovers/${nomsNumber}`,
      handle404: true,
      handle500: true,
      errorMessage: 'PomToRoHandoverData  is currently unavailable.',
    })
  }

  async getPomDetails(nomsNumber: string): Promise<PrisonOffenderManagerData> {
    return this.get({
      path: `/api/allocation/${nomsNumber}`,
      handle404: true,
      handle500: true,
      errorMessage: 'Prison offender manager name is currently unavailable.',
    })
  }
}
