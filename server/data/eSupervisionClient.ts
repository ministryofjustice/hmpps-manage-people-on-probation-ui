import config from '../config'
import RestClient from './restClient'

import {
  CheckinScheduleRequest,
  CheckinScheduleResponse,
  DeactivateOffenderRequest,
  ESupervisionCheckIn,
  ESupervisionNote,
  EsupervisionQuestionTemplatesResponse,
  ESupervisionReview,
  LocationInfo,
  OffenderCheckinsByCRNResponse,
  OffenderInfo,
  OffenderSetup,
  OffenderSetupCompleteResponse,
  ReactivateOffenderRequest,
} from './model/esupervision'
import { ErrorSummary } from './model/common'
import { esupervisionAdditionalQuestions } from '../controllers/mocks/esupervisionAdditionalQuestions'

export default class ESupervisionClient extends RestClient {
  constructor(token: string) {
    super('HMPPS E-Supervision API', config.apis.eSupervisionApi, token)
  }

  async postOffenderSetup(body: OffenderInfo): Promise<OffenderSetup> {
    return this.post({
      data: body,
      path: `/v2/offender_setup`,
      errorMessage: 'Failed to post offender checkin details',
    })
  }

  async getProfilePhotoUploadLocation(offenderSetup: OffenderSetup, photoContentType: string): Promise<LocationInfo> {
    return this.post({
      path: `/v2/offender_setup/${offenderSetup.uuid}/upload_location`,
      query: { 'content-type': photoContentType },
      headers: { 'Content-Type': 'application/json' },
      errorMessage: 'Failed to fetch check-in upload location',
    })
  }

  async postOffenderSetupComplete(setupId: string): Promise<OffenderSetupCompleteResponse> {
    return this.post({
      path: `/v2/offender_setup/${setupId}/complete`,
      errorMessage: 'Failed to complete offender checkin registration',
    })
  }

  async getOffenderCheckIn(uuid: string, personalDetails: boolean = true): Promise<ESupervisionCheckIn> {
    return this.get({
      path: `/v2/offender_checkins/${uuid}?include-personal-details=${personalDetails}`,
    })
  }

  async postOffenderCheckInReview(uuid: string, review: ESupervisionReview): Promise<ESupervisionCheckIn> {
    return this.post({
      path: `/v2/offender_checkins/${uuid}/review`,
      data: review,
    })
  }

  async postOffenderCheckInStarted(uuid: string, practitioner: string): Promise<ESupervisionCheckIn> {
    return this.post({
      path: `/v2/offender_checkins/${uuid}/review-started`,
      data: { practitionerId: practitioner },
    })
  }

  async postOffenderCheckInNote(uuid: string, notes: ESupervisionNote): Promise<void> {
    return this.post({
      path: `/v2/offender_checkins/${uuid}/annotate`,
      data: notes,
    })
  }

  async getOffenderCheckinsByCRN(crn: string): Promise<OffenderCheckinsByCRNResponse | null> {
    return this.get({ path: `/v2/offenders/crn/${crn}`, handle404: true })
  }

  async postUpdateOffenderDetails(
    uuid: string,
    checkinScheduleRequest: CheckinScheduleRequest,
  ): Promise<CheckinScheduleResponse> {
    return this.post({
      path: `/v2/offenders/${uuid}/update_details`,
      data: checkinScheduleRequest,
    })
  }

  async postDeactivateOffender(
    uuid: string,
    deactivateOffenderRequest: DeactivateOffenderRequest,
  ): Promise<CheckinScheduleResponse> {
    return this.post({
      path: `/v2/offenders/${uuid}/deactivate`,
      data: deactivateOffenderRequest,
    })
  }

  async postReactivateOffender(
    uuid: string,
    reactivateOffenderRequest: ReactivateOffenderRequest,
  ): Promise<CheckinScheduleResponse> {
    return this.post({
      path: `/v2/offenders/${uuid}/reactivate`,
      data: reactivateOffenderRequest,
    })
  }

  // gets question templates
  async getQuestionsTemplates(lang: string): Promise<EsupervisionQuestionTemplatesResponse> {
    // return this.get({
    //   path: `/v2/questions/templates?lang=${lang}`,
    // })
    // temporary use of mock data
    const response: EsupervisionQuestionTemplatesResponse = esupervisionAdditionalQuestions
    return response
  }

  // assigns selected questions to a check in
  // async postAssignQuestionsToCheckIn(
  //   uuid: string,
  //   reactivateOffenderRequest: ReactivateOffenderRequest,
  // ): Promise<CheckinScheduleResponse> {
  //   return this.post({
  //     path: `/v2/question-list/assign`,
  //     data: {},
  //   })
  // }

  // when questions have already been assigned to a check in
  // async getAssignedQuestionsList(lang: string): Promise<EsupervisionQuestionTemplatesResponse> {
  //   return this.get({
  //     path: `/v2/questions/question-list/assign/{id}`,
  //   })
  //   const response: EsupervisionQuestionTemplatesResponse = {
  //   }
  //   return response
  // }
}
