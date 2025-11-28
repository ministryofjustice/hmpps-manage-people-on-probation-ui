import config from '../config'
import RestClient from './restClient'

import { LocationInfo, OffenderInfo, OffenderSetup } from './model/eSuperVision'

export default class ESupervisionClient extends RestClient {
  constructor(token: string) {
    super('HMPPS E-Supervision API', config.apis.eSupervisionApi, token)
  }

  async postOffenderSetup(body: OffenderInfo): Promise<OffenderSetup> {
    return this.post({
      data: body,
      path: `/offender_setup`,
      handle404: false,
      handle500: false,
      errorMessageFor500: 'Failed to post offender checkin details',
    })
  }

  async getProfilePhotoUploadLocation(offenderSetup: OffenderSetup, photoContentType: string): Promise<LocationInfo> {
    return this.post({
      path: `/offender_setup/${offenderSetup.uuid}/upload_location`,
      query: { 'content-type': photoContentType },
      headers: { 'Content-Type': 'application/json' },
      handle404: false,
      handle500: false,
      errorMessageFor500: 'Failed to fetch upload upload location',
    })
  }
}
