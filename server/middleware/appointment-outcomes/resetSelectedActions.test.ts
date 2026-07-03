import httpMocks from 'node-mocks-http'
import { resetSelectedActions } from './resetSelectedActions'
import { AppointmentOutcomeProps, AppResponse } from '../../models/Locals'
import { mockAppResponse } from '../../controllers/mocks'
import { Activity } from '../../data/model/schedule'
import { setDataValue } from '../../utils'
import { AppointmentSessionOutcome, EnforcementActionPage } from '../../models/Appointments'

const crn = 'X000001'
const contactId = '12345'

jest.mock('../../utils', () => {
  return {
    setDataValue: jest.fn(),
  }
})

const setDataValueSpy = setDataValue as jest.MockedFn<typeof setDataValue>

const buildResponse = (outcome = {}): AppResponse => {
  const appointmentOutcome: Partial<AppointmentOutcomeProps<Activity>> = {
    id: contactId,
    crn,
    appointmentSession: {
      outcome: {
        attendedFailedToComply: null,
        acceptableAbsence: null,
        unacceptableAbsence: null,
        failedToAttend: null,
        otherEnforcementAction: null,
        breachNSICreatedBy: null,
        letterType: null,
        letterSentBy: null,
        updateEnforcementAction: null,
        enforcementActionCode: [],
        ...outcome,
      },
    },
  }
  const locals = {
    appointmentOutcome,
  }
  return mockAppResponse(locals)
}

const req = httpMocks.createRequest({ session: { data: {} } })
const nextSpy = jest.fn()
const expectedPath = ['appointments', crn, contactId, 'outcome']

describe('middleware/appointment-outcomes/resetSelectedActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should reset all the enforcement actions selections in the appointment session', () => {
    const outcome: AppointmentSessionOutcome = {
      outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
      attendedFailedToComply: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      breachNSICreatedBy: 'CASE_ADMIN',
      letterSentBy: 'CASE_ADMIN',
      letterType: 'BREACH_LETTER_SENT',
      enforcementActionCode: ['IBR', 'EA08'],
    }
    const res = buildResponse(outcome)
    resetSelectedActions()(req, res, nextSpy)
    const keys: EnforcementActionPage[] = [
      'attendedFailedToComply',
      'unacceptableAbsence',
      'failedToAttend',
      'otherEnforcementAction',
      'breachNSICreatedBy',
      'letterType',
      'letterSentBy',
      'updateEnforcementAction',
    ]
    keys.forEach((key, i) => {
      expect(req.session.data.appointments?.[crn]?.[contactId]?.outcome?.[key]).toBeUndefined()
    })
    expect(setDataValueSpy).toHaveBeenNthCalledWith(1, req.session.data, [...expectedPath, 'enforcementActionCode'], [])
  })

  it('should reset the selected breach and letter actions only', () => {
    const outcome: AppointmentSessionOutcome = {
      outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
      attendedFailedToComply: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      breachNSICreatedBy: 'CASE_ADMIN',
      letterSentBy: 'CASE_ADMIN',
      letterType: 'BREACH_LETTER_SENT',
      enforcementActionCode: ['IBR', 'EA08'],
    }
    const res = buildResponse(outcome)
    const keys: EnforcementActionPage[] = ['breachNSICreatedBy', 'letterSentBy', 'letterType']
    resetSelectedActions(keys)(req, res, nextSpy)
    keys.forEach((key, i) => {
      expect(req.session.data.appointments?.[crn]?.[contactId]?.outcome?.[key]).toBeUndefined()
    })
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      1,
      req.session.data,
      [...expectedPath, 'enforcementActionCode'],
      ['IBR'],
    )
  })
})
