import config from '../config'
import RestClient from './restClient'

import {
  CheckinScheduleRequest,
  CheckinScheduleResponse,
  DeactivateOffenderRequest,
  ESupervisionCheckIn,
  ESupervisionNote,
  EsupervisionQuestionsList,
  ESupervisionReview,
  LocationInfo,
  OffenderCheckinsByCRNResponse,
  OffenderInfo,
  OffenderSetup,
  OffenderSetupCompleteResponse,
  ReactivateOffenderRequest,
} from './model/esupervision'
import { ErrorSummary } from './model/common'

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

  async getQuestionsList(lang: string): Promise<EsupervisionQuestionsList> {
    // return this.get({
    //   path: `/v2/questions?lang=${lang}`,
    // })
    const response: EsupervisionQuestionsList = {
      questions: [
        {
          id: '1',
          policy: 'CUSTOM',
          template: 'How has [insert text] been going recently?',
          example: 'unpaid work, college course, work, apprenticeship, university course, sentence plan, training',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '2',
          policy: 'CUSTOM',
          template: 'How have things been feeling [insert text] recently? ',
          example:
            'home, work, relationships with family, appointments with other bodies, physical or mental health, recovery journey',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '3',
          policy: 'CUSTOM',
          template: 'How is [insert text]? ',
          example:
            'physical or mental health, recovery, family relationships, relationship with partner, being a new parent, starting a new course, work',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '4',
          policy: 'CUSTOM',
          template: 'How was [insert text]? ',
          example: 'job interview, doctors appointment, homelessness appointment, landlord visit, birthday',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '5',
          policy: 'CUSTOM',
          template: 'How can we best support you with [insert text]? ',
          example:
            'job interview, appointment, hospital visit, recovery journey, being a new parent, benefits assessment, financial situation, physical or mental health',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '6',
          policy: 'CUSTOM',
          template: 'Have you been able to [insert text]? ',
          example:
            'get an appointment, speak with the housing office, benefits office, home office, council, chase up your application, change jobs, collect medication, complete a form',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '7',
          policy: 'CUSTOM',
          template: 'Have you heard back from [insert text]? ',
          example: 'doctors, council, police, social services, benefits office',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '8',
          policy: 'CUSTOM',
          template: 'Have you been to [insert text] recently? ',
          example: 'a place, an appointment, a group, a service',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '9',
          policy: 'CUSTOM',
          template: 'Have you had any recent contact with [insert text]? ',
          example: 'police, doctors, social services, alcohol or drug recovery referrals, council, family members',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '10',
          policy: 'CUSTOM',
          template: 'Have you changed [insert text] recently? ',
          example: 'address, living situation, vehicle',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '11',
          policy: 'CUSTOM',
          template: 'Has anything changed with [insert text] recently?',
          example:
            'living situation, support network, caring responsibilities,  recovery journey, housing or employment, finances,  relationship, responsibilities at home',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '12',
          policy: 'CUSTOM',
          template: 'Are you currently [insert text]?',
          example:
            'homeless, looking for work, in a new relationship, in contact with a person or service, waiting for housing',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '13',
          policy: 'CUSTOM',
          template: 'Are there any stresses around [insert text] that we could help with?',
          example:
            'work, family, finances, alcohol or drug recovery, physical or mental health, housing, caring for a person, relationships or friendships, probation, sentence plan, training, university, accredited programme, unpaid work',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '14',
          policy: 'CUSTOM',
          template: 'Is there anything that might help [insert text]?',
          example:
            'you feel more supported, grounded, connected to the community, find work, manage your finances better, recovery from health issue, get back on track, with a process',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '15',
          policy: 'CUSTOM',
          template: 'Do you [insert text]? ',
          example:
            "know what's happening with a person, situation, referral, feel safe where you are right now, have an update about something",
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '16',
          policy: 'CUSTOM',
          template: 'Would you like some support with [insert text]? ',
          example:
            'filling in a form, recovery journey, alcohol or drug addiction, a challenging situation, home life, physical or mental health',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '17',
          policy: 'CUSTOM',
          template: 'Would you find it helpful [insert text]? ',
          example:
            'to be referred to a service, to sit and fill in a form together, to speak with someone about something',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '18',
          policy: 'CUSTOM',
          template: 'Were you able to [insert text] since we last spoke?',
          example:
            'go to an appointment, fill in a form, speak with a service, complete a task, apply for a job or house, find a homeless shelter',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '19',
          policy: 'CUSTOM',
          template: 'What have you been doing at [insert text] recently?',
          example:
            'unpaid work, work, alcohol or drug recovery service, group session, accredited programme, home, your hobby or interest',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
        {
          id: '20',
          policy: 'CUSTOM',
          template: 'What can we do to help with [insert text]? ',
          example:
            'an appointment, challenges in life, physical or mental health struggles, addiction, relationship breakdown, moving house, change of circumstances, being a new parent',
          responseFormat: 'TEXT',
          responseSpec: {
            id: 'qustionThing',
            label: 'TODO',
            detailsLabel: 'TODO',
            detailsId: 'thingDetails',
          },
        },
      ],
    }
    return response
  }
}
