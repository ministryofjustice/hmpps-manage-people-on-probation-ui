import httpMocks from 'node-mocks-http'
import { getBackLink } from './getBackLink'
import { AppointmentSessionOutcome } from '../../models/Appointments'
import { AppResponse } from '../../models/Locals'
import { mockAppResponse } from '../../controllers/mocks'

const nextSpy = jest.fn()
const baseUrl = '/base/url'
const baseOutcomeUrl = '/base/outcome/url'

const buildRequest = ({
  url = '',
  query = {},
}: { url?: string; query?: Record<string, string> } = {}): httpMocks.MockRequest<any> => {
  const req = {
    url,
    query,
  }
  return httpMocks.createRequest(req)
}

const buildResponse = ({
  sendLetter = false,
  outcome = {},
  uuid = undefined,
  reqUrl = '',
}: {
  sendLetter?: boolean
  outcome?: Partial<AppointmentSessionOutcome>
  uuid?: string
  reqUrl?: string
} = {}): AppResponse => {
  const locals = {
    appointmentOutcome: {
      baseOutcomeUrl,
      reqUrl,
      uuid,
      baseUrl,
      sendLetter,
      appointmentSession: { outcome },
    },
  }
  return mockAppResponse(locals)
}

describe('/middleware/appointment-outcomes/getBackLink', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('Outcome page', () => {
    it('should set the correct back link if update journey', () => {
      const req = buildRequest({ url: baseOutcomeUrl })
      const res = buildResponse({ reqUrl: baseOutcomeUrl })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseUrl}/manage`)
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
    it('should set the correct back link if arrange journey', () => {
      const req = buildRequest({ url: baseOutcomeUrl })
      const res = buildResponse({ uuid: '12345', reqUrl: baseOutcomeUrl })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseUrl}/location-date-time`)
    })
  })

  describe('Update enforcement action page', () => {
    const url = `${baseOutcomeUrl}/update-enforcement-action`
    it('should set the correct back link', () => {
      const req = buildRequest({ url })
      const res = buildResponse({ reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseUrl}/manage`)
    })
  })

  describe('Other enforcement action page', () => {
    const url = `${baseOutcomeUrl}/enforcement-action`
    const req = buildRequest({ url })
    it('should set the correct back link if linked to from update enforcement action page', () => {
      const outcome: Partial<AppointmentSessionOutcome> = { updateEnforcementAction: 'DIFFERENT_ACTION' }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/update-enforcement-action`)
    })
    it('should set the correct back link if redirected to from update enforcement action page', () => {
      const outcome: Partial<AppointmentSessionOutcome> = { redirectFromUpdate: true }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseUrl}/manage`)
    })
    it('should set the correct back link if attended failed to comply action is DIFFERENT_ACTION', () => {
      const outcome: Partial<AppointmentSessionOutcome> = { attendedFailedToComply: 'DIFFERENT_ACTION' }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/attended-failed-to-comply`)
    })
    it('should set the correct back link if unacceptable absence action is DIFFERENT_ACTION', () => {
      const outcome: Partial<AppointmentSessionOutcome> = { unacceptableAbsence: 'DIFFERENT_ACTION' }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/unacceptable-absence`)
    })
    it('should set the correct back link if failed to attend action is DIFFERENT_ACTION', () => {
      const outcome: Partial<AppointmentSessionOutcome> = { failedToAttend: 'DIFFERENT_ACTION' }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/failed-to-attend`)
    })
  })

  describe('Send a letter page', () => {
    const url = `${baseOutcomeUrl}/send-letter`
    const req = buildRequest({ url })
    it('should set the correct url if linked to from other enforcement action page', () => {
      const outcome: Partial<AppointmentSessionOutcome> = { otherEnforcementAction: 'BREACH_LETTER_SENT' }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/enforcement-action`)
    })
    it('should set the correct url if linked to from update enforcement action page', () => {
      const outcome: Partial<AppointmentSessionOutcome> = { updateEnforcementAction: 'BREACH_LETTER_SENT' }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/update-enforcement-action`)
    })
    it('should set the correct url if attended failed to comply action is SEND_LETTER', () => {
      const outcome: Partial<AppointmentSessionOutcome> = { attendedFailedToComply: 'SEND_LETTER' }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/attended-failed-to-comply`)
    })
    it('should set the correct url if unacceptable absence action is SEND_LETTER', () => {
      const outcome: Partial<AppointmentSessionOutcome> = { unacceptableAbsence: 'SEND_LETTER' }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/unacceptable-absence`)
    })
    it('should set the correct url if failed to attend action is SEND_LETTER', () => {
      const outcome: Partial<AppointmentSessionOutcome> = { failedToAttend: 'SEND_LETTER' }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/failed-to-attend`)
    })
  })

  describe('Initiate breach or recall page', () => {
    const url = `${baseOutcomeUrl}/initiate-breach-or-recall`
    const req = buildRequest({ url })
    it('should set the correct url if linked to from other enforcement action page', () => {
      const outcome: Partial<AppointmentSessionOutcome> = { otherEnforcementAction: 'BREACH_LETTER_SENT' }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/enforcement-action`)
    })
    it('should set the correct url if linked to from update enforcement action page', () => {
      const outcome: Partial<AppointmentSessionOutcome> = { updateEnforcementAction: 'BREACH_LETTER_SENT' }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/update-enforcement-action`)
    })
    it('should set the correct url if attended failed to comply action is SEND_LETTER', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        attendedFailedToComply: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/attended-failed-to-comply`)
    })
    it('should set the correct url if unacceptable absence action is SEND_LETTER', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        unacceptableAbsence: 'BREACH_RECALL_INITIATED',
      }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/unacceptable-absence`)
    })
  })

  describe('Add note page', () => {
    const url = `${baseOutcomeUrl}/add-note`
    const req = buildRequest({ url })
    it('should set the correct url if action is SEND_LETTER', () => {
      const res = buildResponse({ sendLetter: true, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/send-letter`)
    })
    it('should set the correct url if linked to from initiate breach or recall page', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        breachNSICreatedBy: 'USER',
      }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/initiate-breach-or-recall`)
    })
    it('should set the correct url if linked to from other enforcement action page', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        otherEnforcementAction: 'NO_FURTHER_ACTION',
      }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/enforcement-action`)
    })
    it('should set the correct url if linked to from update enforcement action page', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        updateEnforcementAction: 'NO_FURTHER_ACTION',
      }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/update-enforcement-action`)
    })
    it('should set the correct url if linked to from attended failed to comply page', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        attendedFailedToComply: 'NO_FURTHER_ACTION',
      }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/attended-failed-to-comply`)
    })
    it('should set the correct url if linked to from acceptable absence page', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        acceptableAbsence: 'ACCEPTABLE_ABSENCE_EMPLOYMENT',
      }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/acceptable-absence`)
    })
    it('should set the correct url if linked to from unacceptable absence page', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        unacceptableAbsence: 'NO_FURTHER_ACTION',
      }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/unacceptable-absence`)
    })
    it('should set the correct url if linked to from failed to attend page', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        failedToAttend: 'NO_FURTHER_ACTION',
      }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/failed-to-attend`)
    })
    it('should set the correct url if outcome type is ATTENDED_COMPLIED', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'ATTENDED_COMPLIED',
      }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(baseOutcomeUrl)
    })
    it('should set the correct url if outcome type is ATTENDED_SENT_HOME_SERVICE_ISSUES', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'ATTENDED_SENT_HOME_SERVICE_ISSUES',
      }
      const res = buildResponse({ outcome, reqUrl: url })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(baseOutcomeUrl)
    })
  })
})
