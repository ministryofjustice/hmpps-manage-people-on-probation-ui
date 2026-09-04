import superagent, { SuperAgentRequest } from 'superagent'

const stubEmptyHomepage = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/delius/user/USER1/homepage',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        upcomingAppointments: [],
        appointmentsRequiringOutcomeCount: 0,
        appointmentsRequiringOutcome: [],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubEmptyEnforcementContacts = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/contact/USER1/enforcements',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        enforcementContacts: [],
        size: 0,
        page: 0,
        totalResults: 0,
        totalPages: 0,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubEnforcementsTimeout = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/contact/USER1/enforcements',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        enforcementContacts: [],
        size: 0,
        page: 0,
        totalResults: 0,
        totalPages: 0,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      fixedDelayMilliseconds: 10000,
    },
  })

const stubAlertsTimeout = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/alerts(\\?.*)?',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        content: [
          {
            id: 1,
            type: {
              description: 'Email/Text from offender',
              editable: true,
            },
            crn: 'X000001',
            date: '2025-07-10',
            description: 'Email from offending community team',
            alertNotes: [
              {
                id: 0,
                createdBy: 'Custody Status Service',
                createdByDate: '2024-07-19',
                note: 'Person did not attend appointment at 2pm. No contact made prior to appointment time. Phone call attempted but no answer.',
                hasNoteBeenTruncated: false,
              },
            ],
            name: {
              forename: 'Caroline',
              middleName: '',
              surname: 'Wolff',
            },
            officer: {
              name: {
                forename: 'Officer',
                middleName: '',
                surname: 'Test',
              },
              code: 'STMOR01',
            },
            riskLevel: 'MEDIUM',
          },
        ],
        totalResults: 1,
        totalPages: 1,
        page: 0,
        size: 1,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      fixedDelayMilliseconds: 10000,
    },
  })

export default {
  stubEmptyHomepage,
  stubEmptyEnforcementContacts,
  stubEnforcementsTimeout,
  stubAlertsTimeout,
}
