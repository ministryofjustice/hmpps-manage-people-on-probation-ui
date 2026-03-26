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
          name: {
            forename: 'Peter',
            surname: 'Parker',
          },
          homeArea: 'London',
          team: 'Automated Allocation Team',
          email: 'peter.parker@testemail.com',
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
            name: {
              forename: 'Andy',
              surname: 'Best',
            },
            nameAndRole: 'andy best (PS-PSO)',
            email: 'andy.best@testemail.com',
          },
          {
            username: 'peter-parker',
            name: {
              forename: 'Peter',
              surname: 'Parker',
            },
            nameAndRole: 'peter parker (PS-PSO)',
            email: 'peter.parker@testemail.com',
          },
          {
            username: 'tony-pan',
            name: {
              forename: 'Tony',
              surname: 'Pan',
            },
            nameAndRole: 'tony pan (PS-PSO)',
            email: 'tony.pan@testemail.com',
          },
          {
            username: 'terry-jones',
            name: {
              forename: 'Terry',
              surname: 'Jones',
            },
            nameAndRole: 'terry jones (PS-PSO)',
            email: 'terry.jones@testemail.com',
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubNoAllocatedProbationPractitionerProviderAccess }
