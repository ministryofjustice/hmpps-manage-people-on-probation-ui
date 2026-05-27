import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../../controllers/mocks'
import { getCurrentEnforcementAction } from './getCurrentEnforcementAction'
import { PersonAppointmentEnforcementAction } from '../../data/model/schedule'

const buildResponse = ({
  action = null,
  enforcementAction = null,
}: { action?: string; enforcementAction?: PersonAppointmentEnforcementAction } = {}) => {
  const locals = {
    appointmentOutcome: {
      forename: 'James',
      baseOutcomeUrl: '/base/outcome/url',
      appointment: {
        action,
      },
      appointmentSession: {
        outcome: {
          outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
        },
      },
    },
    personAppointment: {
      enforcementAction,
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
    const enforcementAction: PersonAppointmentEnforcementAction = {
      code: 'EA02',
      description: 'First Warning Letter Sent',
      responseByDate: '2026-05-23',
    }
    const res = buildResponse({ action: text, enforcementAction })
    getCurrentEnforcementAction(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.currentEnforcementAction).toStrictEqual({
      action: 'FIRST_WARNING_LETTER_SENT',
      code: 'EA02',
      description: text,
      evidenceDueDate: '23 May 2026',
      evidenceWarning: 'James has until 23 May to submit evidence (0 days remaining)',
      link: '/base/outcome/url/attended-failed-to-comply',
      tagColour: 'YELLOW',
    })
  })
  it(`should set the correct values if current enforcement action is 'No Further Action'`, () => {
    const text = 'No Further Action'
    const enforcementAction: PersonAppointmentEnforcementAction = {
      code: 'NFA',
      description: 'No Further Action',
      responseByDate: '2026-05-23',
    }
    const res = buildResponse({ action: text, enforcementAction })
    getCurrentEnforcementAction(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.currentEnforcementAction).toStrictEqual({
      action: 'NO_FURTHER_ACTION',
      code: 'NFA',
      description: text,
      evidenceDueDate: '23 May 2026',
      evidenceWarning: 'James has until 23 May to submit evidence (0 days remaining)',
      link: '/base/outcome/url/attended-failed-to-comply',
      tagColour: 'GREEN',
    })
  })
  it(`should set the correct values if current enforcement action is 'Refer to Offender Manager' and no evidence due date`, () => {
    const text = 'Refer to Offender Manager'
    const enforcementAction: PersonAppointmentEnforcementAction = {
      code: 'ROM',
      description: text,
    }
    const res = buildResponse({ action: text, enforcementAction })
    getCurrentEnforcementAction(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.currentEnforcementAction).toStrictEqual({
      action: 'REFER_TO_OFFENDER_MANAGER',
      code: 'ROM',
      description: text,
      evidenceDueDate: null,
      evidenceWarning: null,
      link: '/base/outcome/url/attended-failed-to-comply',
      tagColour: 'PURPLE',
    })
  })
  it(`should set the correct values if current enforcement action is 'Withdrawal of Warning'`, () => {
    const text = 'Withdrawal of Warning'
    const enforcementAction: PersonAppointmentEnforcementAction = {
      code: 'EA07',
      description: text,
      responseByDate: '2026-05-23',
    }
    const res = buildResponse({ action: text, enforcementAction })
    getCurrentEnforcementAction(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.currentEnforcementAction).toStrictEqual({
      action: 'WITHDRAWAL_OF_WARNING',
      code: 'EA07',
      description: text,
      evidenceDueDate: '23 May 2026',
      evidenceWarning: 'James has until 23 May to submit evidence (0 days remaining)',
      link: '/base/outcome/url/attended-failed-to-comply',
      tagColour: 'GREEN',
    })
  })
})
