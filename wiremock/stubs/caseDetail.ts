import superagent, { SuperAgentRequest } from 'superagent'

const stubNoAllocatedCOM = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/case/.*/probation-practitioner',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        code: 'N56A048',
        name: {
          forename: 'Ambuj',
          surname: 'Pathak',
        },
        provider: {
          code: 'N56',
          description: 'East of England',
        },
        team: {
          code: 'N56DTX',
          description: 'Default Designated Transfer Team',
        },
        unallocated: true,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default {
  stubNoAllocatedCOM,
}
