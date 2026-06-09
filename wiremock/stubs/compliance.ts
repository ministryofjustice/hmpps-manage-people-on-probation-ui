import superagent, { SuperAgentRequest } from 'superagent'

const stubBreachCompliance = ({ crn = 'X778160' } = {}): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: `/mas/compliance/${crn}`,
      method: 'GET',
      queryParameters: {
        months: { equalTo: '12' },
      },
    },
    response: {
      status: 200,
      jsonBody: {
        personSummary: {
          name: { forename: 'Berge', surname: 'Alton' },
          crn,
          dateOfBirth: '1979-08-18',
        },
        previousOrders: {
          count: 5,
          breaches: 2,
          lastEndedDate: '2020-12-12',
          orders: [],
        },
        currentSentences: [
          {
            eventNumber: '12345',
            activeBreach: {
              startDate: '2024-01-15',
              status: 'Breach initiated',
            },
            order: {
              description: '12 month Community order',
              startDate: '2023-12-01',
              endDate: '2026-01-01',
            },
            compliance: {
              currentBreaches: 1,
              breachStarted: true,
              breachesOnCurrentOrderCount: 1,
              failureToComplyCount: 2,
              failureToComplyInLast12MonthsCount: 2,
            },
            activity: {
              acceptableAbsenceCount: 3,
              unacceptableAbsenceCount: 5,
              attendedButDidNotComplyCount: 2,
            },
            mainOffence: {
              code: '18502',
              description: 'Breach of Restraining Order (Protection from Harassment Act 1997) - 00831',
            },
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubNonComplianceHistory = ({ crn = 'X778160' } = {}): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: `/mas/compliance/non-compliance-detail/${crn}`,
      method: 'GET',
      queryParameters: {
        months: { equalTo: '12' },
      },
    },
    response: {
      status: 200,
      jsonBody: {
        acceptableAbsence: [],
        unacceptableAbsence: [
          {
            contactId: 12345,
            eventNumber: '1',
            eventId: 1,
            type: {
              code: 'NS',
              description: 'Planned Office Visit (NS)',
            },
            date: '2026-01-18',
          },
        ],
        attendedButDidNotComply: [],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default {
  stubBreachCompliance,
  stubNonComplianceHistory,
}
