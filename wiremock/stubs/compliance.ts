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

const stubNoBreachCompliance = ({ crn = 'X778160' } = {}): SuperAgentRequest =>
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
          breaches: 0,
          lastEndedDate: '2020-12-12',
          orders: [],
        },
        currentSentences: [
          {
            eventNumber: '2501192724',
            order: {
              description: '12 month Community order',
              startDate: '2023-12-01',
              endDate: '2026-01-01',
            },
            compliance: {
              currentBreaches: 0,
              breachStarted: false,
              breachesOnCurrentOrderCount: 0,
              failureToComplyCount: 0,
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

export default {
  stubBreachCompliance,
  stubNoBreachCompliance,
}
