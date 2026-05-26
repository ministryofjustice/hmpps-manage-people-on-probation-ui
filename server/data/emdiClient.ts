import config from '../config'
import RestClient from './restClient'

export interface PersonExistsResponse {
  uri: string
}

export default class EMDIClient extends RestClient {
  constructor(token: string) {
    super('HMPPS Electronic Monitoring Data Insights API', config.apis.emdiApi, token)
  }

  async existsInEMDI(crn: string): Promise<PersonExistsResponse | null> {
    return this.get({ path: `/people/exists/${crn}`, handle404: true })
  }
}
