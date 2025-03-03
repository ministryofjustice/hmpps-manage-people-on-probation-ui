import superagent, { SuperAgentRequest } from 'superagent'

const stubUserNoCaseload = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/caseload/user/USER1/search',
      method: 'POST',
      queryParameters: {
        size: {
          equalTo: '10',
        },
        page: {
          equalTo: '0',
        },
      },
    },
    response: {
      status: 200,
      jsonBody: {
        totalPages: 0,
        totalElements: 0,
        sortedBy: 'nextContact.asc',
        provider: 'London',
        staff: {
          forename: 'Paul',
          surname: 'McPhee',
        },
        caseload: null,
        metaData: {
          sentenceTypes: [
            {
              code: '307',
              description: 'Adult Custody < 12m',
            },
            {
              code: '329',
              description: 'ORA Community Order',
            },
          ],
          contactTypes: [
            {
              code: 'APPA03',
              description: 'AP PA - Accommodation',
            },
            {
              code: 'COAI',
              description: 'Initial Appointment - In office (NS)',
            },
            {
              code: 'TCP6',
              description: 'Post Disclosure Session',
            },
          ],
        },
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubUserNoStaffRecord = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/caseload/user/USER1/search',
      method: 'POST',
      queryParameters: {
        size: {
          equalTo: '10',
        },
        page: {
          equalTo: '0',
        },
      },
    },
    response: {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubUserNoCaseload, stubUserNoStaffRecord }
