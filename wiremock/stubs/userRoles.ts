import superagent, { SuperAgentRequest } from 'superagent'

const stubNoRolesFound = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/user/USER1',
      method: 'GET',
    },
    response: {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubRoleNotPresent = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/user/USER1',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        roles: ['WRONG_ROLE'],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubNoRolesFound, stubRoleNotPresent }
