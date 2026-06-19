import config from '../config'
import RestClient from './restClient'

import {
  CheckinScheduleRequest,
  CheckinScheduleResponse,
  DeactivateOffenderRequest,
  EsupervisionAssignQuestionsRequest,
  EsupervisionAssignQuestionsResponse,
  ESupervisionCheckIn,
  ESupervisionNote,
  EsupervisionQuestionTemplatesResponse,
  ESupervisionReview,
  EsupervisionUpcomingQuestionItemsResponse,
  EsupervisionUpcomingQuestionsResponse,
  UploadLocationResponse,
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

  async getProfilePhotoUploadLocation(
    offenderSetup: OffenderSetup,
    photoContentType: string,
    contentSha256Base64: string,
  ): Promise<UploadLocationResponse> {
    return this.post({
      path: `/v2/offender_setup/${offenderSetup.uuid}/upload_location`,
      query: { 'content-type': photoContentType },
      headers: { 'Content-Type': 'application/json' },
      data: { sha256: contentSha256Base64 },
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

  // GET /v2/questions/templates (use in the list questions page)
  async getQuestionsTemplates(language: string = 'en-GB'): Promise<EsupervisionQuestionTemplatesResponse> {
    return this.get({
      path: `/v2/questions/templates?language=${language}`,
    })
  }

  // PUT /v2/questions/assignment (use to assign questions to next check in)
  async putAssignQuestionsToCheckIn(
    crn: string,
    assignQuestionsRequest: EsupervisionAssignQuestionsRequest,
  ): Promise<EsupervisionAssignQuestionsResponse> {
    return this.put({
      path: `/v2/questions/assignment?crn=${crn}`,
      data: assignQuestionsRequest,
    })
  }

  // GET /v2/questions/upcoming/{crn}/question-items (use in the add/edit questions pages)
  async getUpcomingCheckinQuestionItems(
    crn: string,
    language: string = 'en-GB',
  ): Promise<EsupervisionUpcomingQuestionItemsResponse> {
    return this.get({
      path: `/v2/questions/upcoming/${crn}/question-items?language=${language}`,
    })
  }

  // GET /v2/questions/upcoming/{crn}/offender-questions (use in the manage check in page)
  async getUpcomingCheckinQuestions(
    crn: string,
    language: string = 'en-GB',
  ): Promise<EsupervisionUpcomingQuestionsResponse> {
    return this.get({
      path: `/v2/questions/upcoming/${crn}/offender-questions?language=${language}`,
    })
  }

  // DELETE /v2/questions/upcoming/{crn}/question-items (use in the add questions pages if all existing questions are removed and submitted as empty)
  async deleteAssignedQuestionsFromCheckIn(crn: string): Promise<{ message: string }> {
    return this.delete({
      path: `/v2/questions/assignment?crn=${crn}`,
    })
  }
}
