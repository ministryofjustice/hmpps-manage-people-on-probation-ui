import superagent, { SuperAgentRequest } from 'superagent'

const stubSanIndicatorFalse = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    mappings: [
      {
        request: {
          urlPathPattern: '/san-indicator/crn/.*',
          method: 'GET',
        },
        response: {
          status: 200,
          jsonBody: {
            crn: 'X000001',
            sanIndicator: false,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      },
    ],
  })

export default { stubSanIndicatorFalse }
