import superagent, { SuperAgentRequest } from 'superagent'

const stubNoUpcomingAppointments = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/user/USER1/schedule/upcoming',
      method: 'GET',
      queryParameters: {
        page: {
          matches: '.*',
        },
        size: {
          matches: '.*',
        },
      },
    },
    response: {
      status: 200,
      jsonBody: {
        size: 15,
        page: 0,
        totalResults: 54,
        totalPages: 6,
        name: {
          forename: 'Eula',
          middleName: '',
          surname: 'Schmeler',
        },
        appointments: [],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubUpcomingAppointments500Response = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/user/USER1/schedule/upcoming',
      method: 'GET',
      queryParameters: {
        page: {
          matches: '.*',
        },
        size: {
          matches: '.*',
        },
      },
    },
    response: {
      status: 500,
      jsonBody: { message: '500 Error message' },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubNoUpcomingAppointments, stubUpcomingAppointments500Response }
