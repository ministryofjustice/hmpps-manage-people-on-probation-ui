import superagent, { SuperAgentRequest } from 'superagent'

const stubPatchDocument500Response = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/documents/.*/update/contact/.*',
      method: 'PATCH',
    },
    response: {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubPatchDocumentThrownErrorResponse = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/documents/.*/update/contact/.*',
      method: 'PATCH',
    },
    response: {
      fault: 'CONNECTION_RESET_BY_PEER',
    },
  })

export default { stubPatchDocument500Response, stubPatchDocumentThrownErrorResponse }
