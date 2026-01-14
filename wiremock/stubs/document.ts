import superagent, { SuperAgentRequest } from 'superagent'

const stubPatchDocument500Response = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/documents/.*/update/contact/.*',
      method: 'PATCH',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubPatchDocument200Response = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      method: 'PATCH',
      urlPathPattern: '/documents/.*/update/contact/.*',
    },
    response: {
      status: 200,
      jsonBody: {},
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
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubUnsupportedMediaTypeDocumentThrownErrorResponse = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/documents/.*/update/contact/.*',
      method: 'PATCH',
    },
    response: {
      status: 415,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default {
  stubPatchDocument200Response,
  stubPatchDocument500Response,
  stubPatchDocumentThrownErrorResponse,
  stubUnsupportedMediaTypeDocumentThrownErrorResponse,
}
