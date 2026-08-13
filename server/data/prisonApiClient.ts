import { Readable } from 'stream'
import RestClient from './restClient'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'

export default class PrisonApiClient extends RestClient {
  constructor(token: string) {
    super('PrisonApiClient', config.apis.prisonApi, token)
  }

  async getImageData(nomsNumber: string): Promise<Readable> {
    return this.get({ path: `/api/bookings/offenderNo/${nomsNumber}/image/data`, responseType: 'stream', handle404: true }) 
  }
}
