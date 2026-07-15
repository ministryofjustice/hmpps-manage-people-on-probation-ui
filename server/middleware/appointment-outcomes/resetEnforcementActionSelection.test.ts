import httpMocks from 'node-mocks-http'
import { resetEnforcementActionSelection } from './resetEnforcementActionSelection'
import { setDataValue } from '../../utils'
import { AppointmentEnforcementAction, AppointmentSession, AppointmentSessionOutcome } from '../../models/Appointments'

const crn = 'X000001'
const id = '12345'

const baseOutcomeUrl = `/case/${crn}/appointments/appointment/${id}/outcome`

const mockOutcome: AppointmentSessionOutcome = {
  attendedFailedToComply: 'NO_FURTHER_ACTION',
  acceptableAbsence: 'ACCEPTABLE_ABSENCE_HOLIDAY',
  unacceptableAbsence: 'NO_FURTHER_ACTION',
  failedToAttend: 'NO_FURTHER_ACTION',
  otherEnforcementAction: 'NO_FURTHER_ACTION',
  breachNSICreatedBy: 'USER',
  letterType: 'FIRST_WARNING_LETTER_SENT',
  letterSentBy: 'USER',
  updateEnforcementAction: 'NO_FURTHER_ACTION',
}

jest.mock('../../utils', () => {
  const actualUtils = jest.requireActual('../../utils')
  return {
    ...actualUtils,
    setDataValue: jest.fn(),
  }
})

const setDataValueSpy = setDataValue as jest.MockedFunction<typeof setDataValue>
const nextSpy = jest.fn()

const checkReset = (req: httpMocks.MockRequest<any>) => {
  expect(setDataValueSpy).toHaveBeenNthCalledWith(
    1,
    req.session.data,
    ['appointments', crn, id, 'outcome', 'enforcementActionCode'],
    [],
  )
  expect(req.session.data.appointments[crn][id].outcome.attendedFailedToComply).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.acceptableAbsence).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.unacceptableAbsence).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.failedToAttend).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.otherEnforcementAction).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.breachNSICreatedBy).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.letterType).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.letterSentBy).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.updateEnforcementAction).toBeUndefined()
}

const buildRequest = ({ outcome = {} }: { outcome?: AppointmentSessionOutcome }): httpMocks.MockRequest<any> => {
  const req = {
    session: {
      data: {
        appointments: {
          [crn]: {
            [id]: {
              outcome: JSON.parse(JSON.stringify(outcome)),
            },
          },
        },
      },
    },
  }
  return httpMocks.createRequest(req)
}

const buildResponse = ({
  sendBreachOrRecallLetter = false,
  otherAction = false,
  appointmentSession = undefined as AppointmentSession,
  reqUrl = `/case/${crn}/appointment/appointment/${id}/failed-to-attend`,
} = {}): httpMocks.MockResponse<any> => {
  const res = {
    locals: {
      appointmentOutcome: {
        crn,
        id,
        sendBreachOrRecallLetter,
        otherAction,
        appointmentSession,
        reqUrl,
        baseOutcomeUrl,
      },
    },
  }
  return httpMocks.createResponse(res)
}

describe('middleware/resetEnforcementActionSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should return next() if action is initiate breach and send letter and current page is initiate breach or recall', () => {
    const req = httpMocks.createRequest({ session: {} })
    const res = buildResponse({ sendBreachOrRecallLetter: true, reqUrl: '/outcome/initiate-breach-or-recall' })
    resetEnforcementActionSelection(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(setDataValueSpy).not.toHaveBeenCalled()
  })

  it('should return next() if other action is selected and current page is update enforcement action and DIFFERENT_ACTION is posted', () => {
    const req = httpMocks.createRequest({
      session: {},
      body: { appointments: { [crn]: { [id]: { outcome: { updateEnforcementAction: 'DIFFERENT_ACTION' } } } } },
    })
    const res = buildResponse({
      otherAction: true,
      reqUrl: `${baseOutcomeUrl}/update-enforcement-action`,
    })
    resetEnforcementActionSelection(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(setDataValueSpy).not.toHaveBeenCalled()
  })

  it('should reset selected actions when other action is in session but user posts a non-DIFFERENT_ACTION value on update-enforcement-action (Change to NFA scenario)', () => {
    const outcome: AppointmentSessionOutcome = {
      ...mockOutcome,
      updateEnforcementAction: 'DIFFERENT_ACTION',
      otherEnforcementAction: 'SECOND_WARNING_LETTER_SENT',
    }
    const req = buildRequest({ outcome })
    Object.assign(req, {
      body: { appointments: { [crn]: { [id]: { outcome: { updateEnforcementAction: 'NO_FURTHER_ACTION' } } } } },
    })
    const res = buildResponse({
      otherAction: true,
      reqUrl: `${baseOutcomeUrl}/update-enforcement-action`,
    })
    resetEnforcementActionSelection(req, res, nextSpy)
    checkReset(req)
  })

  it('should return next() if other action is selected and current page is enforcement action', () => {
    const req = httpMocks.createRequest({ session: {} })
    const res = buildResponse({
      otherAction: true,
      reqUrl: `${baseOutcomeUrl}/enforcement-action`,
    })
    resetEnforcementActionSelection(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(setDataValueSpy).not.toHaveBeenCalled()
  })

  it('should reset selected actions when other action is selected and user returns to attended-failed-to-comply (Change scenario)', () => {
    const outcome: AppointmentSessionOutcome = {
      ...mockOutcome,
      attendedFailedToComply: 'DIFFERENT_ACTION',
      otherEnforcementAction: 'FIRST_WARNING_LETTER_SENT',
    }
    const req = buildRequest({ outcome })
    const res = buildResponse({
      otherAction: true,
      reqUrl: `${baseOutcomeUrl}/attended-failed-to-comply`,
    })
    resetEnforcementActionSelection(req, res, nextSpy)
    checkReset(req)
  })

  it('should reset the selected actions if current page is outcome', () => {
    const req = buildRequest({ outcome: mockOutcome })
    const res = buildResponse({
      reqUrl: baseOutcomeUrl,
    })
    resetEnforcementActionSelection(req, res, nextSpy)
    checkReset(req)
  })

  const enforcementActionPages = [
    baseOutcomeUrl,
    `${baseOutcomeUrl}/attended-failed-to-comply`,
    `${baseOutcomeUrl}/acceptable-absence`,
    `${baseOutcomeUrl}/unacceptable-absence`,
    `${baseOutcomeUrl}/failed-to-attend`,
    `${baseOutcomeUrl}/enforcement-action`,
    `${baseOutcomeUrl}/update-enforcement-action`,
  ]

  enforcementActionPages.forEach(page => {
    it(`should reset the selected actions if current page is ${page}`, () => {
      const req = buildRequest({ outcome: mockOutcome })
      const res = buildResponse({
        reqUrl: page,
      })
      resetEnforcementActionSelection(req, res, nextSpy)
      checkReset(req)
    })
  })

  describe('letter reset behaviour', () => {
    const outcomeWithLetter: AppointmentSessionOutcome = {
      ...mockOutcome,
      letterType: 'FIRST_WARNING_LETTER_SENT',
      letterSentBy: 'USER',
    }

    it('should reset letterType and letterSentBy when SEND_LETTER is posted but was not previously selected', () => {
      const req = buildRequest({ outcome: outcomeWithLetter })
      req.body = { appointments: { [crn]: { [id]: { outcome: { attendedFailedToComply: 'SEND_LETTER' } } } } }
      // Use a URL not in enforcementActionPages so the main reset does not run
      const res = buildResponse({
        appointmentSession: { outcome: { ...outcomeWithLetter, attendedFailedToComply: 'NO_FURTHER_ACTION' } },
        reqUrl: `${baseOutcomeUrl}/initiate-breach-or-recall`,
      })
      resetEnforcementActionSelection(req, res, nextSpy)
      expect(req.session.data.appointments[crn][id].outcome.letterType).toBeUndefined()
      expect(req.session.data.appointments[crn][id].outcome.letterSentBy).toBeUndefined()
    })

    it('should not reset letterType and letterSentBy when updateEnforcementAction was previously SEND_LETTER and SEND_LETTER is now posted', () => {
      const outcomeWithUpdateAction: AppointmentSessionOutcome = {
        ...outcomeWithLetter,
        updateEnforcementAction: 'SEND_LETTER',
      }
      const req = buildRequest({ outcome: outcomeWithUpdateAction })
      req.body = { appointments: { [crn]: { [id]: { outcome: { attendedFailedToComply: 'SEND_LETTER' } } } } }
      const res = buildResponse({
        appointmentSession: { outcome: outcomeWithUpdateAction },
        reqUrl: `${baseOutcomeUrl}/initiate-breach-or-recall`,
      })
      resetEnforcementActionSelection(req, res, nextSpy)
      expect(req.session.data.appointments[crn][id].outcome.letterType).toBe('FIRST_WARNING_LETTER_SENT')
      expect(req.session.data.appointments[crn][id].outcome.letterSentBy).toBe('USER')
    })

    it('should not reset letterType and letterSentBy when SEND_LETTER was already the selected action', () => {
      const outcomeAlreadySendLetter: AppointmentSessionOutcome = {
        ...outcomeWithLetter,
        attendedFailedToComply: 'SEND_LETTER',
      }
      const req = buildRequest({ outcome: outcomeAlreadySendLetter })
      req.body = { appointments: { [crn]: { [id]: { outcome: { attendedFailedToComply: 'SEND_LETTER' } } } } }
      // Use a URL not in enforcementActionPages so the main reset does not run
      const res = buildResponse({
        appointmentSession: { outcome: outcomeAlreadySendLetter },
        reqUrl: `${baseOutcomeUrl}/initiate-breach-or-recall`,
      })
      resetEnforcementActionSelection(req, res, nextSpy)
      expect(req.session.data.appointments[crn][id].outcome.letterType).toBe('FIRST_WARNING_LETTER_SENT')
      expect(req.session.data.appointments[crn][id].outcome.letterSentBy).toBe('USER')
    })

    it('should reset letterType and letterSentBy on /enforcement-action when a different letter action is posted', () => {
      const outcomeWithOtherAction: AppointmentSessionOutcome = {
        ...outcomeWithLetter,
        otherEnforcementAction: 'FIRST_WARNING_LETTER_SENT',
      }
      const req = buildRequest({ outcome: outcomeWithOtherAction })
      req.body = {
        appointments: { [crn]: { [id]: { outcome: { otherEnforcementAction: 'SECOND_WARNING_LETTER_SENT' } } } },
      }
      // otherAction: true skips the main enforcement-action reset so only the letter branch runs
      const res = buildResponse({
        otherAction: true,
        appointmentSession: { outcome: outcomeWithOtherAction },
        reqUrl: `${baseOutcomeUrl}/enforcement-action`,
      })
      resetEnforcementActionSelection(req, res, nextSpy)
      expect(req.session.data.appointments[crn][id].outcome.letterType).toBeUndefined()
      expect(req.session.data.appointments[crn][id].outcome.letterSentBy).toBeUndefined()
    })

    it('should not reset letterType and letterSentBy on /enforcement-action when the same letter action is re-posted', () => {
      const outcomeWithOtherAction: AppointmentSessionOutcome = {
        ...outcomeWithLetter,
        otherEnforcementAction: 'FIRST_WARNING_LETTER_SENT',
      }
      const req = buildRequest({ outcome: outcomeWithOtherAction })
      req.body = {
        appointments: { [crn]: { [id]: { outcome: { otherEnforcementAction: 'FIRST_WARNING_LETTER_SENT' } } } },
      }
      // otherAction: true skips the main enforcement-action reset so only the letter branch runs
      const res = buildResponse({
        otherAction: true,
        appointmentSession: { outcome: outcomeWithOtherAction },
        reqUrl: `${baseOutcomeUrl}/enforcement-action`,
      })
      resetEnforcementActionSelection(req, res, nextSpy)
      expect(req.session.data.appointments[crn][id].outcome.letterType).toBe('FIRST_WARNING_LETTER_SENT')
      expect(req.session.data.appointments[crn][id].outcome.letterSentBy).toBe('USER')
    })

    it('should reset letterType, letterSentBy and breachNSICreatedBy when BREACH_RECALL_INITIATED_AND_SEND_LETTER is posted but was not previously selected', () => {
      const outcomeWithBreach: AppointmentSessionOutcome = {
        ...outcomeWithLetter,
        breachNSICreatedBy: 'USER',
        attendedFailedToComply: 'NO_FURTHER_ACTION',
      }
      const req = buildRequest({ outcome: outcomeWithBreach })
      req.body = {
        appointments: {
          [crn]: { [id]: { outcome: { attendedFailedToComply: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER' } } },
        },
      }
      // Use a URL not in enforcementActionPages so the main reset does not run
      const res = buildResponse({
        appointmentSession: { outcome: outcomeWithBreach },
        reqUrl: `${baseOutcomeUrl}/initiate-breach-or-recall`,
      })
      resetEnforcementActionSelection(req, res, nextSpy)
      expect(req.session.data.appointments[crn][id].outcome.letterType).toBeUndefined()
      expect(req.session.data.appointments[crn][id].outcome.letterSentBy).toBeUndefined()
      expect(req.session.data.appointments[crn][id].outcome.breachNSICreatedBy).toBeUndefined()
    })

    it('should reset letterType and letterSentBy on /enforcement-action when switching from a letter action to a non-letter action', () => {
      const outcomeWithOtherAction: AppointmentSessionOutcome = {
        ...outcomeWithLetter,
        otherEnforcementAction: 'FIRST_WARNING_LETTER_SENT',
      }
      const req = buildRequest({ outcome: outcomeWithOtherAction })
      req.body = {
        appointments: { [crn]: { [id]: { outcome: { otherEnforcementAction: 'BREACH_RECALL_INITIATED' } } } },
      }
      // otherAction: true skips the main enforcement-action reset so only the letter branch runs
      const res = buildResponse({
        otherAction: true,
        appointmentSession: { outcome: outcomeWithOtherAction },
        reqUrl: `${baseOutcomeUrl}/enforcement-action`,
      })
      resetEnforcementActionSelection(req, res, nextSpy)
      expect(req.session.data.appointments[crn][id].outcome.letterType).toBeUndefined()
      expect(req.session.data.appointments[crn][id].outcome.letterSentBy).toBeUndefined()
    })
  })
})
