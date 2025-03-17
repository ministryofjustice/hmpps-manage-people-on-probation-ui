import superagent, { SuperAgentRequest } from 'superagent'

const stubEmptyHomepage = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/user/USER1/appointments',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        provider: 'London',
        staff: {
          forename: 'Paul',
          surname: 'McPhee',
        },
        appointments: [],
        outcomes: [],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubEmptyHomepage }
