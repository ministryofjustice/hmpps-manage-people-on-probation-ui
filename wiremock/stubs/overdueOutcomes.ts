import superagent, { SuperAgentRequest } from 'superagent'
import { DateTime } from 'luxon'

const stubSingleOverdueOutcome = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/appointment/.*/overdue-outcomes',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        content: [
          {
            id: 5,
            type: {
              code: 'DGTSLC',
              description: 'Phone call',
            },
            // Relative to today so the outcome stays inside the app's rolling outcomes window (filterContactsMonths)
            date: DateTime.now().setZone('Europe/London').minus({ days: 7 }).toISODate(),
            start: '10:15:00',
            end: '10:30:00',
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubNoOverdueOutcomes = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/appointment/.*/overdue-outcomes',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        content: [],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubSingleOverdueOutcome, stubNoOverdueOutcomes }
