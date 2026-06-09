import superagent, { SuperAgentRequest } from 'superagent'
import { NonComplianceContact } from '../../server/data/model/overview'

const nonComplianceContact: NonComplianceContact = {
  contactId: 6,
  eventNumber: '1',
  eventId: 1,
  type: {
    code: 'NS',
    description: 'Planned Office Visit (NS)',
  },
  date: '2026-01-18',
}

const stubCompliance = ({
  crn = 'X778160',
  activeBreach = true,
  activeRecall = false,
  priorBreachesOnCurrentOrderCount = 1,
  eventNumber = '12345',
}: {
  crn?: string
  activeBreach?: boolean
  activeRecall?: boolean
  priorBreachesOnCurrentOrderCount?: number
  eventNumber?: string
} = {}): SuperAgentRequest =>
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
            eventNumber,
            activeBreach: activeBreach
              ? {
                  startDate: '2024-01-15',
                  status: 'Breach initiated',
                }
              : null,
            activeRecall: activeRecall
              ? {
                  startDate: '2024-01-15',
                  status: 'Recall initiated',
                }
              : null,
            order: {
              description: '12 month Community order',
              startDate: '2023-12-01',
              endDate: '2026-01-01',
            },
            compliance: {
              currentBreaches: 1,
              breachStarted: true,
              breachesOnCurrentOrderCount: 0,
              priorBreachesOnCurrentOrderCount,
              failureToComplyCount: 2,
            },
            activity: {
              acceptableAbsenceCount: 3,
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

const stubPersonNonComplianceDetail = ({
  crn = 'X778160',
  acceptableAbsenceCount = 0,
  unacceptableAbsenceCount = 1,
  attendedButDidNotComplyCount = 0,
} = {}): SuperAgentRequest => {
  const acceptableAbsence =
    acceptableAbsenceCount > 0 ? Array.from({ length: acceptableAbsenceCount }).map(_i => nonComplianceContact) : []
  const unacceptableAbsence =
    unacceptableAbsenceCount > 0 ? Array.from({ length: unacceptableAbsenceCount }).map(_i => nonComplianceContact) : []
  const attendedButDidNotComply =
    attendedButDidNotComplyCount > 0
      ? Array.from({ length: attendedButDidNotComplyCount }).map(_i => nonComplianceContact)
      : []
  return superagent.post('http://localhost:9091/__admin/mappings').send({
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
        acceptableAbsence,
        unacceptableAbsence,
        attendedButDidNotComply,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })
}

export default {
  stubCompliance,
  stubPersonNonComplianceDetail,
}
