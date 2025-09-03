import superagent, { SuperAgentRequest } from 'superagent'

const stubNoUserLocationsFound = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/appointment/location/provider/.*/team/.*',
      method: 'GET',
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
