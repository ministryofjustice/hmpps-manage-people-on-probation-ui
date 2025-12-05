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
        code: 'N07B795',
        name: {
          forename: 'Deborah',
          surname: 'Fern',
        },
        provider: {
          code: 'N07',
          name: 'London',
        },
        team: {
          code: 'N07AAT',
          description: 'Automated Allocation Team',
        },
        unallocated: true,
        username: 'DeborahFern',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default {
  stubNoAllocatedCOM,
}
