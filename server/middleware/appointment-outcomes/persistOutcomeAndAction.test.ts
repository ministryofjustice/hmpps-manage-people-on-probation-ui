import httpMocks from 'node-mocks-http'
import { persistOutcomeAndAction } from './persistOutcomeAndAction'
import { mockAppResponse } from '../../controllers/mocks'
import { AppointmentSessionOutcome } from '../../models/Appointments'

const buildRequest = (): httpMocks.MockRequest<any> => {
  const req = {
    params: {
      id: '',
      contactId: '',
    },
    session: {
      data: {},
    },
  }
  return httpMocks.createRequest(req)
}

const res = mockAppResponse()

describe('middleware/appointment-outcome/persistOutcomeAndAction', () => {
  it('should return null if no outcome logged', () => {
    const req = buildRequest()
    const result = persistOutcomeAndAction(null)(req, res)
    expect(result).toBeNull()
  })
  it('should return the correct result if only outcome is logged', () => {
    const req = buildRequest()
    const result = persistOutcomeAndAction('Attended - Failed To Comply')(req, res)
    const expectedOutcome: AppointmentSessionOutcome = {
      outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
      outcomeCode: 'AFTC',
    }
    expect(result).toStrictEqual(expectedOutcome)
  })
  it('should return the correct result if outcome is ATTENDED_FAILED_TO_COMPLY and action is BREACH_RECALL_INITIATED', () => {
    const req = buildRequest()
    const result = persistOutcomeAndAction('Attended - Failed To Comply', 'IBR')(req, res)
    const expectedOutcome: AppointmentSessionOutcome = {
      outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
      outcomeCode: 'AFTC',
      enforcementActionCode: ['IBR'],
      attendedFailedToComply: 'BREACH_RECALL_INITIATED',
    }
    expect(result).toStrictEqual(expectedOutcome)
  })
  it('should return the correct result if outcome is ATTENDED_FAILED_TO_COMPLY and action is DECISION_PENDING_RESPONSE', () => {
    const req = buildRequest()
    const result = persistOutcomeAndAction('Attended - Failed To Comply', 'C173')(req, res)
    const expectedOutcome: AppointmentSessionOutcome = {
      outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
      outcomeCode: 'AFTC',
      enforcementActionCode: ['C173'],
      otherEnforcementAction: 'DECISION_PENDING_RESPONSE',
    }
    expect(result).toStrictEqual(expectedOutcome)
  })
  it('should return the correct result if outcome is UNACCEPTABLE_ABSENCE and action is FIRST_WARNING_LETTER_SENT', () => {
    const req = buildRequest()
    const result = persistOutcomeAndAction('Unacceptable Absence', 'EA02')(req, res)
    const expectedOutcome: AppointmentSessionOutcome = {
      outcomeType: 'UNACCEPTABLE_ABSENCE',
      outcomeCode: 'UAAB',
      enforcementActionCode: ['EA02'],
      letterType: 'FIRST_WARNING_LETTER_SENT',
    }
    expect(result).toStrictEqual(expectedOutcome)
  })
  it('should return the correct result if outcome is ACCEPTABLE_ABSENCE and action/reason is ACCEPTABLE_ABSENCE_HOLIDAY', () => {
    const req = buildRequest()
    const result = persistOutcomeAndAction('Acceptable - Critical  Communications - no breach', 'AAHO')(req, res)
    const expectedOutcome: AppointmentSessionOutcome = {
      outcomeType: 'ACCEPTABLE_ABSENCE',
      outcomeCode: 'AAM11',
      enforcementActionCode: ['AAHO'],
      acceptableAbsence: 'ACCEPTABLE_ABSENCE_HOLIDAY',
    }
    expect(result).toStrictEqual(expectedOutcome)
  })
  it('should return the correct result if outcome is FAILED_TO_ATTEND and action is IMMEDIATE_BREACH_OR_RECALL', () => {
    const req = buildRequest()
    const result = persistOutcomeAndAction('Failed To Attend', 'IMB')(req, res)
    const expectedOutcome: AppointmentSessionOutcome = {
      outcomeType: 'FAILED_TO_ATTEND',
      outcomeCode: 'AFTA',
      enforcementActionCode: ['IMB'],
      otherEnforcementAction: 'IMMEDIATE_BREACH_OR_RECALL',
    }
    expect(result).toStrictEqual(expectedOutcome)
  })
})
