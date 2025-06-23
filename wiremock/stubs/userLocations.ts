import superagent, { SuperAgentRequest } from 'superagent'

const stubNoUserLocationsFound = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/appointment/location',
      method: 'GET',
      queryParameters: {
        providerCode: {
          matches: '.*',
        },
        teamCode: {
          matches: '.*',
        },
      },
    },
    response: {
      status: 200,
      jsonBody: {
        locations: [],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubNoUserLocationsFound }
