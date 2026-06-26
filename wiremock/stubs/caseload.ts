import superagent, { SuperAgentRequest } from 'superagent'
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
      urlPathPattern: '/mas/caseload/user/USER1/search',
      method: 'POST',
      queryParameters: {},
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
            crn: 'X778160',
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
          {
            caseName: {
              forename: 'Kari',
              middleName: '',
              surname: 'Bradtke',
            },
            crn: 'X801756',
            dob: '1986-07-19',
            previousAppointment: {
              id: 11,
              date: '2024-09-26T09:30:00+01:00',
              description: 'Post Disclosure Session',
            },
            latestSentence: 'Adult Custody < 12m',
            numberOfAdditionalSentences: 1,
          },
          {
            caseName: {
              forename: 'Caroline',
              middleName: '',
              surname: 'Wolff',
            },
            crn: 'X000001',
            dob: '2002-01-09',
            latestSentence: '12 month Community order',
            numberOfAdditionalSentences: 1,
          },
          {
            crn: 'X808126',
            limitedAccess: true,
          },
          {
            caseName: {
              forename: 'Wendell',
              middleName: '',
              surname: 'Dooley',
            },
            crn: 'X777916',
            dob: '2001-02-14',
            latestSentence: 'Adult Custody < 12m',
            numberOfAdditionalSentences: 0,
          },
          {
            caseName: {
              forename: 'Vera',
              middleName: '',
              surname: 'Kessler',
            },
            crn: 'X765410',
            dob: '1977-11-21',
            latestSentence: 'Adult Custody < 12m',
            numberOfAdditionalSentences: 0,
          },
          {
            caseName: {
              forename: 'Lillie',
              middleName: '',
              surname: 'Stokes',
            },
            crn: 'X765523',
            dob: '1978-08-09',
            latestSentence: 'Adult Custody < 12m',
            numberOfAdditionalSentences: 0,
          },
          {
            caseName: {
              forename: 'Dallas',
              middleName: '',
              surname: 'Bashirian',
            },
            crn: 'X767016',
            dob: '1979-11-10',
            latestSentence: 'Adult Custody < 12m',
            numberOfAdditionalSentences: 0,
          },
          {
            caseName: {
              forename: 'Elvira',
              middleName: '',
              surname: 'Rogahn',
            },
            crn: 'X767644',
            dob: '1955-11-16',
            latestSentence: 'Adult Custody < 12m',
            numberOfAdditionalSentences: 0,
          },
          {
            caseName: {
              forename: 'Nicole',
              middleName: '',
              surname: 'Kutch',
            },
            crn: 'X769773',
            dob: '1955-03-16',
            latestSentence: 'Adult Custody < 12m',
            numberOfAdditionalSentences: 0,
          },
        ],
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
