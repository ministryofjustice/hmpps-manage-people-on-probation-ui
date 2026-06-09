import httpMocks from 'node-mocks-http'
import { persistOutcomeAndAction } from './persistOutcomeAndAction'
import { mockAppResponse } from '../../controllers/mocks'
import { AppointmentSessionOutcome } from '../../models/Appointments'
import { getContactOutcomes } from './getContactOutcomes'
import { ContactEnforcementAction, ContactOutcome } from '../../data/model/schedule'

const mockEnforcementActions: ContactEnforcementAction[] = [
  {
    code: 'NFA',
    description: 'No Further Action',
  },
  {
    code: 'IBR',
    description: 'Breach / Recall Initiated',
  },
  {
    code: 'EA02',
    description: 'First Warning Letter Sent',
    defaultResponsePeriodDays: 7,
  },
  {
    code: 'C173',
    description: 'Decision Pending Response',
    defaultResponsePeriodDays: 7,
  },
  {
    code: 'IMB',
    description: 'Immediate Breach or Recall',
    defaultResponsePeriodDays: 7,
  },
]

const mockContactOutcomes: ContactOutcome[] = [
  {
    code: 'ATTC',
    description: 'Attended - Complied',
    enforcementActions: [],
  },
  {
    code: 'AFTC',
    description: 'Attended - Failed To Comply',
    enforcementActions: mockEnforcementActions,
  },
  {
    code: 'AFTA',
    description: 'Failed To Attend',
    enforcementActions: mockEnforcementActions,
  },
  {
    code: 'UAAB',
    description: 'Unacceptable Absence',
    enforcementActions: mockEnforcementActions,
  },
  { code: 'AAHO', description: 'Acceptable Absence - Holiday', enforcementActions: [] },
  { code: 'AAME', description: 'Acceptable Absence - Medical', enforcementActions: [] },
]

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

jest.mock('./getContactOutcomes')

const mockedGetContactOutcomes = jest.mocked(getContactOutcomes)

mockedGetContactOutcomes.mockReturnValue(jest.fn().mockReturnValue(mockContactOutcomes))

describe('middleware/appointment-outcome/persistOutcomeAndAction', () => {
  it('should return null if no outcome logged', async () => {
    const req = buildRequest()
    const result = persistOutcomeAndAction({ outcome: null })
    expect(result).toBeNull()
  })
  it('should return the correct result if only outcome is logged', async () => {
    const req = buildRequest()
    const result = persistOutcomeAndAction({ outcome: 'Attended - Complied' })
    const expectedOutcome: AppointmentSessionOutcome = {
      outcomeType: 'ATTENDED_COMPLIED',
      outcomeCode: 'ATTC',
    }
    expect(result).toStrictEqual(expectedOutcome)
  })
  it('should return the correct result if outcome is ACCEPTABLE_ABSENCE_HOLIDAY', async () => {
    const req = buildRequest()
    const result = persistOutcomeAndAction({ outcome: 'Acceptable Absence - Holiday' })
    const expectedOutcome: AppointmentSessionOutcome = {
      outcomeType: 'ACCEPTABLE_ABSENCE',
      outcomeCode: 'AAHO',
      acceptableAbsence: 'ACCEPTABLE_ABSENCE_HOLIDAY',
    }
    expect(result).toStrictEqual(expectedOutcome)
  })
  it('should return the correct result if outcome is ATTENDED_FAILED_TO_COMPLY and action is BREACH_RECALL_INITIATED', async () => {
    const req = buildRequest()
    const result = persistOutcomeAndAction({ outcome: 'Attended - Failed To Comply', actionCode: 'IBR' })
    const expectedOutcome: AppointmentSessionOutcome = {
      outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
      outcomeCode: 'AFTC',
      enforcementActionCode: ['IBR'],
      attendedFailedToComply: 'BREACH_RECALL_INITIATED',
    }
    expect(result).toStrictEqual(expectedOutcome)
  })
  it('should return the correct result if outcome is ATTENDED_FAILED_TO_COMPLY and action is DECISION_PENDING_RESPONSE', async () => {
    const req = buildRequest()
    const result = persistOutcomeAndAction({ outcome: 'Attended - Failed To Comply', actionCode: 'C173' })
    const expectedOutcome: AppointmentSessionOutcome = {
      outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
      outcomeCode: 'AFTC',
      enforcementActionCode: ['C173'],
      otherEnforcementAction: 'DECISION_PENDING_RESPONSE',
    }
    expect(result).toStrictEqual(expectedOutcome)
  })
  it('should return the correct result if outcome is UNACCEPTABLE_ABSENCE and action is FIRST_WARNING_LETTER_SENT', async () => {
    const req = buildRequest()
    const result = persistOutcomeAndAction({ outcome: 'Unacceptable Absence', actionCode: 'EA02' })
    const expectedOutcome: AppointmentSessionOutcome = {
      outcomeType: 'UNACCEPTABLE_ABSENCE',
      outcomeCode: 'UAAB',
      enforcementActionCode: ['EA02'],
      letterType: 'FIRST_WARNING_LETTER_SENT',
    }
    expect(result).toStrictEqual(expectedOutcome)
  })
  it('should return the correct result if outcome is FAILED_TO_ATTEND and action is IMMEDIATE_BREACH_OR_RECALL', async () => {
    const req = buildRequest()
    const result = persistOutcomeAndAction({ outcome: 'Failed To Attend', actionCode: 'IMB' })
    const expectedOutcome: AppointmentSessionOutcome = {
      outcomeType: 'FAILED_TO_ATTEND',
      outcomeCode: 'AFTA',
      enforcementActionCode: ['IMB'],
      otherEnforcementAction: 'IMMEDIATE_BREACH_OR_RECALL',
    }
    expect(result).toStrictEqual(expectedOutcome)
  })
})
