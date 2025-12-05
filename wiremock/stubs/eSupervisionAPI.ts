import superagent, { SuperAgentRequest } from 'superagent'

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
export default { stubOffenderSetup422Response, stubOffenderSetup500Response, stubOffenderSetupComplete500Response }
