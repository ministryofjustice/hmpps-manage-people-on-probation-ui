import superagent, { SuperAgentRequest } from 'superagent'

const stubNoAllocatedProbationPractitionerProviderAccess = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/user/USER1/providers',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        defaultUserDetails: {
          username: 'PETER-PARKER',
          homeArea: 'London',
          team: 'Automated Allocation Team',
        },
        providers: [
          {
            code: 'N50',
            name: 'Greater Manchester',
          },
          {
            code: 'N54',
            name: 'North East Region',
          },
        ],
        teams: [
          {
            description: 'Automated Allocation Team',
            code: 'N07AAT',
          },
          {
            description: 'Automation SPG',
            code: 'N07CHT',
          },
          {
            description: 'Homelessness Prevention Team,',
            code: 'N07HPT',
          },
        ],
        users: [
          {
            username: 'andy-best',
            nameAndRole: 'andy best (PS-PSO)',
          },
          {
            username: 'peter-parker',
            nameAndRole: 'peter parker (PS-PSO)',
          },
          {
            username: 'tony-pan',
            nameAndRole: 'tony pan (PS-PSO)',
          },
          {
            username: 'terry-jones',
            nameAndRole: 'terry jones (PS-PSO)',
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubNoAllocatedProbationPractitionerProviderAccess }
