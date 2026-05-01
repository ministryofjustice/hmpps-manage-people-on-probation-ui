import superagent, { SuperAgentRequest } from 'superagent'

const stubEmptyHomepage = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/delius/user/USER1/homepage',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        upcomingAppointments: [],
        appointmentsRequiringOutcomeCount: 0,
        appointmentsRequiringOutcome: [],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubEmptyHomepage }
