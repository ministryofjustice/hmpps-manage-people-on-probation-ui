import superagent, { SuperAgentRequest } from 'superagent'

const stubNoRelatedContacts = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      method: 'GET',
      urlPathPattern: `/mas/schedule/.*/appointment/.*/linked-contacts`,
    },
    response: {
      status: 200,
      jsonBody: [],
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default {
  stubNoRelatedContacts,
}
