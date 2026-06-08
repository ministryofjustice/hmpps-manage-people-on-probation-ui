import httpMocks from 'node-mocks-http'
import { DateTime } from 'luxon'
import { getFailedToAttendTicket } from './getFailedToAttendTicket'
import type { Option } from '../../models/Option'
import { mockAppResponse } from '../../controllers/mocks'
import { AppointmentEnforcementAction } from '../../models/Appointments'
import { ContactEnforcementAction, ContactOutcome } from '../../data/model/schedule'

const forename = 'Stuart'

jest.mock('../../data/hmppsAuthClient')
jest.mock('../../data/masApiClient')

const mockContactEnforcementActions = ({
  matchingResponsePeriodDays = true,
}: { matchingResponsePeriodDays?: boolean } = {}): ContactEnforcementAction[] => [
  { code: 'ROM', description: 'Refer to Offender Manager', defaultResponsePeriodDays: 7 },
  {
    code: 'EA12',
    description: 'Decision Pending Response from Person on Probation',
    defaultResponsePeriodDays: matchingResponsePeriodDays ? 7 : undefined,
  },
]

const mockContactOutcomes = ({
  matchingResponsePeriodDays = true,
}: { matchingResponsePeriodDays?: boolean } = {}): ContactOutcome[] => [
  {
    code: 'AFTA',
    description: 'Failed to attend',
    enforcementActions: mockContactEnforcementActions({ matchingResponsePeriodDays }),
  },
]

const mockOptions: Option<AppointmentEnforcementAction>[] = [
  {
    value: 'DECISION_PENDING_RESPONSE_FROM_PERSON_ON_PROBATION',
    text: `Decision pending Stuart’s response`,
  },
  {
    value: 'REFER_TO_OFFENDER_MANAGER',
    text: 'Refer to offender manager',
  },
]

const buildResponse = ({
  matchingResponsePeriodDays = true,
}: {
  options?: Option<AppointmentEnforcementAction>[]
  matchingResponsePeriodDays?: boolean
} = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      forename,
      options: mockOptions,
      appointmentSession: {
        date: '2026-06-03',
        outcome: {
          contactOutcomes: mockContactOutcomes({ matchingResponsePeriodDays }),
        },
      },
    },
  }
  return mockAppResponse(locals)
}

const req = httpMocks.createRequest()
const nextSpy = jest.fn()

describe('middleware/appointment-outcomes/getFailedToAttendTicket', () => {
  it('should not assign a ticket if not all enforcement actions have same response period value', () => {
    const res = buildResponse({ matchingResponsePeriodDays: false })
    getFailedToAttendTicket(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.ticket).toBeNull()
  })
  it('should assign the correct ticket values if all enforcement actions have the same response period value', () => {
    const res = buildResponse()
    jest.spyOn(DateTime, 'now').mockReturnValueOnce(DateTime.fromISO('2026-06-05') as DateTime<true>)
    getFailedToAttendTicket(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.ticket).toStrictEqual(
      expect.objectContaining({
        title: 'Stuart has until 10 June 2026 to submit evidence (5 days remaining)',
      }),
    )
  })
  it('should assign the correct ticket values if all enforcement actions have the same response period value and has one day remaining', () => {
    const res = buildResponse()
    jest.spyOn(DateTime, 'now').mockReturnValueOnce(DateTime.fromISO('2026-06-09') as DateTime<true>)
    getFailedToAttendTicket(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.ticket).toStrictEqual(
      expect.objectContaining({
        title: 'Stuart has until 10 June 2026 to submit evidence (1 day remaining)',
      }),
    )
  })
})
