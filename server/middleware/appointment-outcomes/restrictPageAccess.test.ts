import httpMocks from 'node-mocks-http'
import { restrictPageAccess } from './restrictPageAccess'
import { AppointmentOutcomeType, AppointmentSession, AppointmentSessionOutcome } from '../../models/Appointments'

const crn = 'X000001'
const contactId = '12345'
const uuid = 'e95d9080-2c74-4317-bc01-845c7bf22603'

const expectedBaseUrl = {
  manage: `/case/${crn}/appointments/appointment/${contactId}`,
  arrange: `/case/${crn}/arrange-appointment/${uuid}`,
}
const expectedOriginRedirectUrl = {
  manage: `${expectedBaseUrl.manage}/manage`,
  arrange: `${expectedBaseUrl.arrange}/sentence`,
}
const expectedOutcomeRedirectUrl = {
  manage: `${expectedBaseUrl.manage}/outcome`,
  arrange: `${expectedBaseUrl.arrange}/outcome`,
}

interface Props {
  outcome?: Partial<AppointmentSessionOutcome>
  appointment?: Partial<AppointmentSession>
  _uuid?: string
  _contactId?: string
  sessionId?: string
  url?: string
}

const mockAppointmentSession = ({ outcome = {}, appointment = {} }: Props = {}) => ({
  outcome: {
    ...outcome,
  },
  type: 'COAP',
  eventId: '123',
  date: '2026-05-29',
  ...appointment,
})

const buildRequest = ({
  url = '/attended-failed-to-comply',
  _uuid,
  _contactId,
  sessionId,
  outcome = {},
  appointment = {},
}: Props = {}): httpMocks.MockRequest<any> => {
  const id = sessionId || _uuid || _contactId
  const req = {
    url,
    params: {
      id: _uuid,
      contactId: _contactId,
      crn,
    },
    session: {
      data: {
        appointments: {
          [crn]: {
            [id]: mockAppointmentSession({ outcome, appointment }),
          },
        },
      },
    },
  }
  return httpMocks.createRequest(req)
}

const res = httpMocks.createResponse()
const redirectSpy = jest.spyOn(res, 'redirect')
const nextSpy = jest.fn()

describe('middleware/appointment-outcomes/restrictPageAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('Add notes page linked to from manage appointment page', () => {
    const url = '/outcome/add-note?put=true'
    it('should only call next()', () => {
      const req = buildRequest({ _contactId: contactId, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('No required default values in session', () => {
    it('should redirect to the sentence page if arrange appointment journey', () => {
      const appointment: Partial<AppointmentSession> = { date: '' }
      const req = buildRequest({ _uuid: uuid, appointment })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).toHaveBeenCalledWith(expectedOriginRedirectUrl.arrange)
      expect(nextSpy).not.toHaveBeenCalled()
    })

    it('should redirect to the manage appointment page if manage journey', () => {
      const appointment: Partial<AppointmentSession> = { date: '' }
      const req = buildRequest({ _contactId: contactId, appointment })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).toHaveBeenCalledWith(expectedOriginRedirectUrl.manage)
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })

  const outcomes: [AppointmentOutcomeType, string, string][] = [
    ['ATTENDED_FAILED_TO_COMPLY', 'Attended - failed to comply', '/outcome/attended-failed-to-comply'],
    ['ACCEPTABLE_ABSENCE', 'Acceptable absence', '/outcome/acceptable-absence'],
    ['UNACCEPTABLE_ABSENCE', 'Unacceptable absence', '/outcome/unacceptable-absence'],
    ['FAILED_TO_ATTEND', 'Failed to attend', '/outcome/failed-to-attend'],
  ]
  outcomes.forEach(([outcomeType, title, url]) => {
    describe(title, () => {
      it(`should call next() if outcome selected is ${outcomeType}`, () => {
        const outcome: Partial<AppointmentSessionOutcome> = { outcomeType }
        const req = buildRequest({ _uuid: uuid, outcome, url })
        restrictPageAccess(req, res, nextSpy)
        expect(redirectSpy).not.toHaveBeenCalled()
        expect(nextSpy).toHaveBeenCalledTimes(1)
      })
      it('should redirect to the outcome page if outcome has not been selected', () => {
        const req = buildRequest({ _contactId: contactId, url })
        restrictPageAccess(req, res, nextSpy)
        expect(redirectSpy).toHaveBeenCalledWith(expectedOutcomeRedirectUrl.manage)
        expect(nextSpy).not.toHaveBeenCalled()
      })
      it(`should redirect to the outcome page if outcome selected is not ${outcomeType}`, () => {
        const outcome: Partial<AppointmentSessionOutcome> = { outcomeType: 'ATTENDED_COMPLIED' }
        const req = buildRequest({ _contactId: contactId, outcome, url })
        restrictPageAccess(req, res, nextSpy)
        expect(redirectSpy).toHaveBeenCalledWith(expectedOutcomeRedirectUrl.manage)
        expect(nextSpy).not.toHaveBeenCalled()
      })
    })
  })

  describe('Other enforcement action', () => {
    const url = '/outcome/enforcement-action'

    it('should redirect to the outcome page if non of the options criteria are met', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'ACCEPTABLE_ABSENCE',
        acceptableAbsence: 'ACCEPTABLE_ABSENCE_HOLIDAY',
      }
      const req = buildRequest({ _contactId: contactId, outcome, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).toHaveBeenCalledWith(expectedOutcomeRedirectUrl.manage)
      expect(nextSpy).not.toHaveBeenCalled()
    })
    it('should call next() if one of the option criteria is met', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
        attendedFailedToComply: 'DIFFERENT_ACTION',
      }
      const req = buildRequest({ _contactId: contactId, outcome, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Initiate a breach or recall', () => {
    const url = '/outcome/initiate-breach-or-recall'
    it('should redirect to the outcome page if non of the options criteria are met', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'UNACCEPTABLE_ABSENCE',
        unacceptableAbsence: 'NO_FURTHER_ACTION',
      }
      const req = buildRequest({ _uuid: uuid, outcome, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).toHaveBeenCalledWith(expectedOutcomeRedirectUrl.arrange)
      expect(nextSpy).not.toHaveBeenCalled()
    })
    it('should call next() if one of the option criteria is met', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'UNACCEPTABLE_ABSENCE',
        unacceptableAbsence: 'BREACH_RECALL_INITIATED',
      }
      const req = buildRequest({ _uuid: uuid, outcome, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Send a letter', () => {
    const url = '/outcome/send-letter'
    it('should redirect to the outcome page if non of the options criteria are met', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
        attendedFailedToComply: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      }
      const req = buildRequest({ _uuid: uuid, outcome, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).toHaveBeenCalledWith(expectedOutcomeRedirectUrl.arrange)
      expect(nextSpy).not.toHaveBeenCalled()
    })
    it('should call next() if one of the option criteria is met', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'FAILED_TO_ATTEND',
        failedToAttend: 'SEND_LETTER',
      }
      const req = buildRequest({ _uuid: uuid, outcome, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Update enforcement action', () => {
    const url = '/outcome/update-enforcement-action'
    it('should redirect to the outcome page if non of the options criteria are met', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'ACCEPTABLE_ABSENCE',
        acceptableAbsence: 'ACCEPTABLE_ABSENCE_COURT_LEGAL',
      }
      const req = buildRequest({ _contactId: contactId, outcome, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).toHaveBeenCalledWith(expectedOutcomeRedirectUrl.manage)
      expect(nextSpy).not.toHaveBeenCalled()
    })
    it('should call next() if one of the option criteria is met', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
        attendedFailedToComply: 'BREACH_RECALL_INITIATED',
      }
      const req = buildRequest({ _uuid: uuid, outcome, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Add notes', () => {
    const url = '/outcome/add-note'
    it('should redirect to the outcome page if non of the options criteria are met', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'ACCEPTABLE_ABSENCE',
      }
      const req = buildRequest({ _contactId: contactId, outcome, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).toHaveBeenCalledWith(expectedOutcomeRedirectUrl.manage)
      expect(nextSpy).not.toHaveBeenCalled()
    })
    it('should redirect to the outcome page if non of the options criteria are met', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'ATTENDED_SENT_HOME_BEHAVIOUR',
        attendedFailedToComply: 'BREACH_RECALL_INITIATED',
      }
      const req = buildRequest({ _contactId: contactId, outcome, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).toHaveBeenCalledWith(expectedOutcomeRedirectUrl.manage)
      expect(nextSpy).not.toHaveBeenCalled()
    })
    it('should call next() if one of the option criteria is met', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
        attendedFailedToComply: 'SEND_LETTER',
        letterType: 'FIRST_WARNING_LETTER_SENT',
      }
      const req = buildRequest({ _uuid: uuid, outcome, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
    it('should call next() if one of the option criteria is met **', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
        otherEnforcementAction: 'DECISION_PENDING_RESPONSE',
      }
      const req = buildRequest({ _contactId: contactId, outcome, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Next supervision appointment', () => {
    const url = '/outcome/next-appointment'
    it('should redirect to the outcome page if non of the options criteria are met', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'UNACCEPTABLE_ABSENCE',
        unacceptableAbsence: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      }
      const req = buildRequest({ _contactId: contactId, outcome, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).toHaveBeenCalledWith(expectedOutcomeRedirectUrl.manage)
      expect(nextSpy).not.toHaveBeenCalled()
    })
    it('should call next() if one of the option criteria is met', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
        attendedFailedToComply: 'BREACH_RECALL_INITIATED',
        breachNSICreatedBy: 'USER',
      }
      const appointment: Partial<AppointmentSession> = { notes: 'Some notes' }
      const req = buildRequest({ _contactId: contactId, outcome, appointment, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Check your answers', () => {
    const url = '/outcome/check-your-answers'
    it('should redirect to the outcome page if non of the options criteria are met', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: undefined,
      }
      const req = buildRequest({ _contactId: contactId, outcome, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).toHaveBeenCalledWith(expectedOutcomeRedirectUrl.manage)
      expect(nextSpy).not.toHaveBeenCalled()
    })
    it('should call next() if one of the option criteria is met', () => {
      const outcome: Partial<AppointmentSessionOutcome> = {
        outcomeType: 'ATTENDED_COMPLIED',
        nextAppointment: 'KEEP_TYPE',
      }
      const appointment: Partial<AppointmentSession> = { notes: 'Some notes' }
      const req = buildRequest({ _contactId: contactId, outcome, appointment, url })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Confirmation', () => {
    const url = '/outcome/confirmation'
    it('should redirect to the origin page if no appointment session is found for current uuid', () => {
      const req = buildRequest({ url, _uuid: uuid, sessionId: '1111' })
      restrictPageAccess(req, res, nextSpy)
      expect(redirectSpy).toHaveBeenCalledWith(expectedOriginRedirectUrl.arrange)
      expect(nextSpy).not.toHaveBeenCalled()
    })
    it('should call next() if appointment session is found for current contactId', () => {
      const req = buildRequest({ _contactId: contactId, url })
      restrictPageAccess(req, res, nextSpy)
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
})
