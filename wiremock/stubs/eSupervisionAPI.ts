import superagent, { SuperAgentRequest } from 'superagent'
import { esupervisionAdditionalQuestions } from '../../server/controllers/mocks/esupervisionAdditionalQuestions'

const stubOffenderSetup500Response = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    priority: 1,
    request: {
      urlPathPattern: '/esupervision/v2/offender_setup',
      method: 'POST',
    },
    response: {
      status: 500,
      jsonBody: {
        status: 500,
        errorCode: null,
        userMessage: '500 internal server error',
        developerMessage: '500 internal server error',
        moreInfo: null,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubOffenderSetup422Response = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    priority: 1,
    request: {
      urlPathPattern: '/esupervision/v2/offender_setup',
      method: 'POST',
    },
    response: {
      status: 422,
      jsonBody: {
        status: 422,
        errorCode: null,
        userMessage: '422 BAD_REQUEST Unprocessable entity: contact information already in use',
        developerMessage: '422 BAD_REQUEST Unprocessable entity: contact information already in use',
        moreInfo: null,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubOffenderSetupComplete500Response = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    priority: 1,
    request: {
      urlPathPattern: '/esupervision/v2/offender_setup/.+?/complete',
      method: 'POST',
    },
    response: {
      status: 500,
      jsonBody: {
        status: 500,
        errorCode: null,
        userMessage: 'Unexpected error: No setup found for uuid=93e135af-4526-68ed-fd63-112437f63465',
        developerMessage: 'No setup found for uuid=93e135af-4526-68ed-fd63-112437f63465',
        moreInfo: null,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })
export const stubGetQuestionsTemplates = () => {
  return superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      method: 'GET',
      urlPattern: '/check-in/questions\\?locale=en-GB',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        esupervisionAdditionalQuestions,
      },
    },
  })
}

const stubAssignQuestions = () => {
  return superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      method: 'PUT',
      urlPathPattern: '/v2/questions/assign',
      queryParameters: {
        crn: {
          matches: '.*',
        },
      },
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        expectedCheckinDate: '2026-04-20T10:00:00+01:00',
        listId: 3,
      },
    },
  })
}

const stubGetUpcomingCheckinQuestions = () => {
  return superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      method: 'GET',
      urlPattern: '/v2/questions/upcoming/.+?/offender-questions\\?language=en-GB',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        expectedCheckinDate: '2026-04-20T10:00:00+01:00',
        questions: [],
      },
    },
  })
}

const stubGetUpcomingCheckinQuestionItems = () => {
  return superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      method: 'GET',
      urlPattern: '/v2/questions/upcoming/.+?/question-items\\?language=en-GB',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        upcoming: {
          expectedCheckinDate: '2026-04-20T10:00:00+01:00',
          items: [],
        },
      },
    },
  })
}
export default {
  stubOffenderSetup422Response,
  stubOffenderSetup500Response,
  stubOffenderSetupComplete500Response,
  stubGetQuestionsTemplates,
  stubGetUpcomingCheckinQuestionItems,
  stubGetUpcomingCheckinQuestions,
  stubAssignQuestions,
}
