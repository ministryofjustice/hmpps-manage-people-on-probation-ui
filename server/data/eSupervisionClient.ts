import config from '../config'
import RestClient from './restClient'

import {
  LocationInfo,
  OffenderCheckinsByCRNResponse,
  OffenderInfo,
  OffenderSetup,
  OffenderSetupCompleteResponse,
} from './model/esupervision'
import { ProfessionalContact } from './model/professionalContact'

export default class ESupervisionClient extends RestClient {
  constructor(token: string) {
    super('HMPPS E-Supervision API', config.apis.eSupervisionApi, token)
  }

  async postOffenderSetup(body: OffenderInfo): Promise<OffenderSetup> {
    return this.post({
      data: body,
      path: `/v2/offender_setup`,
      errorMessageFor500: 'Failed to post offender checkin details',
    })
  }

  async getProfilePhotoUploadLocation(offenderSetup: OffenderSetup, photoContentType: string): Promise<LocationInfo> {
    return this.post({
      path: `/v2/offender_setup/${offenderSetup.uuid}/upload_location`,
      query: { 'content-type': photoContentType },
      headers: { 'Content-Type': 'application/json' },
      errorMessageFor500: 'Failed to fetch check-in upload location',
    })
  }

  async postOffenderSetupComplete(setupId: string): Promise<OffenderSetupCompleteResponse> {
    return this.post({
      path: `/v2/offender_setup/${setupId}/complete`,
      errorMessageFor500: 'Failed to complete offender checkin registration',
    })
  }

  async getOffenderCheckinsByCRN(crn: string): Promise<OffenderCheckinsByCRNResponse | null> {
    return this.get({ path: `/v2/offenders/crn/${crn}`, handle404: true })
  }
}
