import superagent, { SuperAgentRequest } from 'superagent'

const stubSanIndicatorTrue = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/arns/san-indicator/crn/.*',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        crn: 'X000001',
        sanIndicator: true,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubArnsUnavailable = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/arns/risks/crn/.*',
      method: 'GET',
    },
    response: {
      status: 500,
      jsonBody: {
        message: 'Error',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubArnsServerError = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/arns/risks/crn/.*',
      method: 'GET',
    },
    response: {
      fault: 'CONNECTION_RESET_BY_PEER',
    },
  })

const stubSentencePlan404 = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/sentence-plan/plans/crn/.*',
      method: 'GET',
    },
    response: {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubSanIndicatorTrue, stubSentencePlan404, stubArnsUnavailable, stubArnsServerError }
