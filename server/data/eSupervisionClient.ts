import config from '../config'
import RestClient from './restClient'

import {
  ESupervisionCheckIn,
  ESupervisionCheckInResponse,
  ESupervisionReview,
  LocationInfo,
  OffenderInfo,
  OffenderSetup,
  OffenderSetupCompleteResponse
} from './model/esupervision'

export default class ESupervisionClient extends RestClient {
  constructor(token: string) {
    super('HMPPS E-Supervision API', config.apis.eSupervisionApi, token)
  }

  async postOffenderSetup(body: OffenderInfo): Promise<OffenderSetup> {
    return this.post({
      data: body,
      path: `/v2/offender_setup`,
      handle404: false,
      handle500: false,
      errorMessageFor500: 'Failed to post offender checkin details',
    })
  }

  async getProfilePhotoUploadLocation(offenderSetup: OffenderSetup, photoContentType: string): Promise<LocationInfo> {
    return this.post({
      path: `/v2/offender_setup/${offenderSetup.uuid}/upload_location`,
      query: { 'content-type': photoContentType },
      headers: { 'Content-Type': 'application/json' },
      handle404: false,
      handle500: false,
      errorMessageFor500: 'Failed to fetch check-in upload location',
    })
  }

  async postOffenderSetupComplete(setupId: string): Promise<OffenderSetupCompleteResponse> {
    return this.post({
      path: `/v2/offender_setup/${setupId}/complete`,
      handle404: false,
      handle500: false,
      errorMessageFor500: 'Failed to complete offender checkin registration',
    })
  }

  async getOffenderCheckIn(uuid: string): Promise<ESupervisionCheckInResponse> {
    return this.get({
      path: `/offender_checkins/${uuid}`,
    })
  }

  async postOffenderCheckInReview(uuid: string, review: ESupervisionReview): Promise<ESupervisionCheckIn> {
    return this.post({
      path: `/offender_checkins/${uuid}/review`,
      data: review,
    })
  }
}
