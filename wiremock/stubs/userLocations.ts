import superagent, { SuperAgentRequest } from 'superagent'

const stubNoUserLocationsFound = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/user/USER1/locations',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        name: {
          forename: 'Eula',
          middleName: '',
          surname: 'Schmeler',
        },
        locations: [],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubNoUserLocationsFound }
