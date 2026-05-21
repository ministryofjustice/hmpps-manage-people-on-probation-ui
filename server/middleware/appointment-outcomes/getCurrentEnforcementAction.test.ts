import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../../controllers/mocks'
import { getCurrentEnforcementAction } from './getCurrentEnforcementAction'

const buildResponse = ({ action = null }: { action?: string } = {}) => {
  const locals = {
    appointmentOutcome: {
      appointment: {
        action,
      },
    },
  }
  return mockAppResponse(locals)
}

const req = httpMocks.createRequest()
const nextSpy = jest.fn()

xdescribe('middleware/appointment-outcomes/getCurrentEnforcementAction', () => {
  it('should not set the current enforcement action to null if does not exist', () => {
    const res = buildResponse()
    getCurrentEnforcementAction(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.currentEnforcementAction).toBeNull()
  })
  it(`should set the correct values if current enforcement action is 'First Warning Letter Sent'`, () => {
    const text = 'First Warning Letter Sent'
    const res = buildResponse({ action: text })
    getCurrentEnforcementAction(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.currentEnforcementAction).toStrictEqual({
      action: 'FIRST_WARNING_LETTER_SENT',
      text,
      tagColour: 'YELLOW',
    })
  })
  it(`should set the correct values if current enforcement action is 'No Further Action'`, () => {
    const text = 'No Further Action'
    const res = buildResponse({ action: text })
    getCurrentEnforcementAction(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.currentEnforcementAction).toStrictEqual({
      action: 'NO_FURTHER_ACTION',
      text,
      tagColour: 'GREEN',
    })
  })
  it(`should set the correct values if current enforcement action is 'Refer to Offender Manager'`, () => {
    const text = 'Refer to Offender Manager'
    const res = buildResponse({ action: text })
    getCurrentEnforcementAction(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.currentEnforcementAction).toStrictEqual({
      action: 'REFER_TO_OFFENDER_MANAGER',
      text,
      tagColour: 'PURPLE',
    })
  })
  it(`should set the correct values if current enforcement action is 'Withdrawal of Warning'`, () => {
    const text = 'Withdrawal of Warning'
    const res = buildResponse({ action: text })
    getCurrentEnforcementAction(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.currentEnforcementAction).toStrictEqual({
      action: 'WITHDRAWAL_OF_WARNING',
      text,
      tagColour: 'GREEN',
    })
  })
})
