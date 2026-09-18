import superagent, { SuperAgentRequest } from 'superagent'

const stubEMDIPeopleExists500Response = (crn: string = 'X000001'): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    priority: 1,
    request: {
      urlPathPattern: `/emdi/people/exists/${crn}`,
      method: 'GET',
    },
    response: {
      status: 500,
      jsonBody: { message: '500 Error message' },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubEMDIPeopleExists503Response = (crn: string = 'X000001'): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    priority: 1,
    request: {
      urlPathPattern: `/emdi/people/exists/${crn}`,
      method: 'GET',
    },
    response: {
      status: 503,
      jsonBody: { message: '503 Error message' },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubEMDIPeopleExists404Response = (crn: string = 'X000001'): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    priority: 1,
    request: {
      urlPathPattern: `/emdi/people/exists/${crn}`,
      method: 'GET',
    },
    response: {
      status: 404,
      jsonBody: { message: 'not found' },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })
export default {
  stubEMDIPeopleExists500Response,
  stubEMDIPeopleExists404Response,
  stubEMDIPeopleExists503Response,
}
