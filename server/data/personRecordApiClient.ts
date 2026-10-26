import { Readable } from 'node:stream'
import RestClient from './restClient'
import config from '../config'

export default class PersonRecordApiClient extends RestClient {
  constructor(token: string) {
    super('PersonRecordClient', config.apis.personRecordApi, token)
  }

  async getImageData(nomsNumber: string): Promise<Readable> {
    return this.get({
      path: `/person/prison/${encodeURIComponent(nomsNumber)}/image`,
      responseType: 'stream',
      handle404: true,
    })
  }
}
