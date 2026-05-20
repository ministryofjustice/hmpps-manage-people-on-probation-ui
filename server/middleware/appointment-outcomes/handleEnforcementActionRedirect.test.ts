import httpMocks from 'node-mocks-http'
import { handleEnforcementActionRedirect } from './handleEnforcementActionRedirect'
import { type AppointmentSessionOutcome } from '../../models/Appointments'
import { type AppResponse } from '../../models/Locals'
import { mockAppResponse } from '../../controllers/mocks'

const baseOutcomeUrl = '/case/X000001/appointments/appointment/1234/outcome'
const change = '/path/to/check-your-answers'
const incompleteRedirect = '/path/to/incomplete/page'

jest.mock('../findUncompleted', () => ({
  findUncompleted: jest.fn(() => incompleteRedirect),
}))

const buildResponse = (outcome: Partial<AppointmentSessionOutcome>): AppResponse => {
  const locals = {
    appointmentOutcome: {
      appointmentSession: {
        outcome,
      },
      baseOutcomeUrl,
    },
  }
  return mockAppResponse(locals)
}

describe('middleware/appointment-outcomes/handleEnforcementActionRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should redirect to the send letter page', () => {
    const req = httpMocks.createRequest()
    const outcome: Partial<AppointmentSessionOutcome> = {
      attendedFailedToComply: 'SEND_LETTER',
    }
    const res = buildResponse(outcome)
    const redirectSpy = jest.spyOn(res, 'redirect')
    handleEnforcementActionRedirect('attendedFailedToComply')(req, res)
    expect(redirectSpy).toHaveBeenCalledWith(`${baseOutcomeUrl}/send-letter`)
  })
  it('should redirect to the initiate breach or recall page with change url query', () => {
    const req = httpMocks.createRequest({ query: { change } })
    const outcome: Partial<AppointmentSessionOutcome> = {
      unacceptableAbsence: 'BREACH_RECALL_INITIATED',
    }
    const res = buildResponse(outcome)
    const redirectSpy = jest.spyOn(res, 'redirect')
    handleEnforcementActionRedirect('unacceptableAbsence')(req, res)
    expect(redirectSpy).toHaveBeenCalledWith(`${baseOutcomeUrl}/initiate-breach-or-recall?change=${change}`)
  })
  it('should redirect to the other enforcement action page', () => {
    const req = httpMocks.createRequest()
    const outcome: Partial<AppointmentSessionOutcome> = {
      failedToAttend: 'DIFFERENT_ACTION',
    }
    const res = buildResponse(outcome)
    const redirectSpy = jest.spyOn(res, 'redirect')
    handleEnforcementActionRedirect('failedToAttend')(req, res)
    expect(redirectSpy).toHaveBeenCalledWith(`${baseOutcomeUrl}/enforcement-action`)
  })
  it('should redirect to the change query url if no secondary action and change url query contains /outcome', () => {
    const outcomeChangeUrl = '/outcome/check-your-answers'
    const req = httpMocks.createRequest({ query: { change: outcomeChangeUrl } })
    const outcome: Partial<AppointmentSessionOutcome> = {
      acceptableAbsence: 'ACCEPTABLE_ABSENCE_HOLIDAY',
    }
    const res = buildResponse(outcome)
    const redirectSpy = jest.spyOn(res, 'redirect')
    handleEnforcementActionRedirect('acceptableAbsence')(req, res)
    expect(redirectSpy).toHaveBeenCalledWith(outcomeChangeUrl)
  })
  it('should redirect to the next incomplete page if no secondary action and change url query does not contain /outcome', () => {
    const req = httpMocks.createRequest({ query: { change } })
    const outcome: Partial<AppointmentSessionOutcome> = {
      acceptableAbsence: 'ACCEPTABLE_ABSENCE_HOLIDAY',
    }
    const res = buildResponse(outcome)
    const redirectSpy = jest.spyOn(res, 'redirect')
    handleEnforcementActionRedirect('acceptableAbsence')(req, res)
    expect(redirectSpy).toHaveBeenCalledWith(incompleteRedirect)
  })
  it('should redirect to the add note page if no secondary action and no change url query', () => {
    const req = httpMocks.createRequest()
    const outcome: Partial<AppointmentSessionOutcome> = {
      otherEnforcementAction: 'SEND_CONFIRMATION_OF_BREACH',
    }
    const res = buildResponse(outcome)
    const redirectSpy = jest.spyOn(res, 'redirect')
    handleEnforcementActionRedirect('otherEnforcementAction')(req, res)
    expect(redirectSpy).toHaveBeenCalledWith(`${baseOutcomeUrl}/add-note`)
  })
})
