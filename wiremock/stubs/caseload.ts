import superagent, { SuperAgentRequest } from 'superagent'
import { DateTime, DateTimeUnit } from 'luxon'
import { WiremockMapping } from '../../integration_tests/utils'

const stubUserNoCaseload = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/caseload/user/USER1/search',
      method: 'POST',
      queryParameters: {
        size: {
          equalTo: '10',
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
      },
    },
    response: {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const getUserCaseloadStub = (allocatedDate: string) => {
  const mapping: WiremockMapping = {
    request: {
      urlPathPattern: '/mas/caseload/user/USER1',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        totalPages: 4,
        totalElements: 33,
        sortedBy: 'nextContact.asc',
        provider: 'London',
        staff: {
          forename: 'Paul',
          surname: 'McPhee',
        },
        caseload: [
          {
            caseName: {
              forename: 'Alton',
              middleName: '',
              surname: 'Berge',
            },
            crn: 'X000001',
            dob: '1975-09-25',
            nextAppointment: {
              id: 6,
              date: '2024-10-22T09:00:00+01:00',
              description: 'AP PA - Accommodation',
            },
            previousAppointment: {
              id: 5,
              date: '2024-09-24T09:00:00+01:00',
              description: 'AP PA - Accommodation',
            },
            latestSentence: 'CJA - Std Determinate Custody',
            numberOfAdditionalSentences: 0,
            allocatedOn: allocatedDate,
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  }
  return mapping
}

const stubCaseload = (allocatedDate: string): SuperAgentRequest => {
  const stub = getUserCaseloadStub(allocatedDate)
  return superagent.post('http://localhost:9091/__admin/mappings').send(stub)
}

const stubUserCaseloadSearch = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/caseload/user/USER1/search',
      method: 'POST',
      queryParameters: {
        size: {
          equalTo: '10',
        },
      },
    },
    response: {
      status: 200,
      jsonBody: {
        totalPages: 4,
        totalElements: 33,
        sortedBy: 'nextContact.asc',
        provider: 'London',
        staff: {
          forename: 'Paul',
          surname: 'McPhee',
        },
        caseload: [
          {
            caseName: {
              forename: 'Alton',
              middleName: '',
              surname: 'Berge',
            },
            crn: 'X000001',
            dob: '1975-09-25',
            nextAppointment: {
              id: 6,
              date: '2024-10-22T09:00:00+01:00',
              description: 'AP PA - Accommodation',
            },
            previousAppointment: {
              id: 5,
              date: '2024-09-24T09:00:00+01:00',
              description: 'AP PA - Accommodation',
            },
            latestSentence: 'CJA - Std Determinate Custody',
            numberOfAdditionalSentences: 0,
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubNoUserCaseloadSearch = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/caseload/user/USER1/search',
      method: 'POST',
      queryParameters: {
        size: {
          equalTo: '10',
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
        caseload: [],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })
export default {
  stubCaseload,
  stubUserNoCaseload,
  stubUserNoStaffRecord,
  stubUserCaseloadSearch,
  stubNoUserCaseloadSearch,
}
