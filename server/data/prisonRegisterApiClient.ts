import RestClient from './restClient'
import config from '../config'

export interface Prison {
  prisonId: string
  prisonName: string
  prisonNameInWelsh?: string
  active: boolean
  male: boolean
  female: boolean
  contracted: boolean
}

export default class PrisonRegisterApiClient extends RestClient {
  constructor(token: string) {
    super('Prison register Api', config.apis.prisonRegisterApi, token)
  }

  async getPrison(prisonId: string): Promise<Prison> {
    return this.get({
      path: `/prisons/id/${prisonId}`,
      handle404: true,
      handle500: true,
      errorMessage: 'Prison register is currently unavailable.',
    })
  }
}
