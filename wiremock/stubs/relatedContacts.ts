import superagent, { SuperAgentRequest } from 'superagent'

const stubRelatedContacts = (args: {
  crn: string
  appointmentId?: string
  contactId?: string
  data: any
}): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      method: 'GET',
      urlPathPattern: `/mas/schedule/${args.crn}/appointment/${args.appointmentId ?? args.contactId}/linked-contacts`,
    },
    response: {
      status: 200,
      jsonBody: args.data,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default {
  stubRelatedContacts,
}
