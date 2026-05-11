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
        enforcementActions: [],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubEmptyEnforcementContacts = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/contact/USER1/enforcements',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        enforcementContacts: [],
        size: 0,
        page: 0,
        totalResults: 0,
        totalPages: 0,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubEmptyHomepage, stubEmptyEnforcementContacts }
