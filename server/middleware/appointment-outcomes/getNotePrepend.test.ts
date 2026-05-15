import httpMocks from 'node-mocks-http'
import { getNotePrepend } from './getNotePrepend'
import { mockAppResponse } from '../../controllers/mocks'
import { EnforcementActionCreatedBy, EnforcementActionLetterType } from '../../models/Appointments'
import { SentenceType } from '../../data/model/sentenceDetails'

const buildResponse = ({
  breachNSICreatedBy = null,
  letterSentBy = null,
  letterType = null,
  sentenceType = 'COMMUNITY',
}: {
  breachNSICreatedBy?: EnforcementActionCreatedBy
  letterSentBy?: EnforcementActionCreatedBy
  letterType?: EnforcementActionLetterType
  sentenceType?: SentenceType
} = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      sentence: {
        type: sentenceType,
      },
      appointmentSession: {
        outcome: {
          breachNSICreatedBy,
          letterSentBy,
          letterType,
        },
      },
    },
  }
  return mockAppResponse(locals)
}

const req = httpMocks.createRequest()

const nextSpy = jest.fn()

describe('/middleware/appointment-outcomes/getNotePrepend', () => {
  it('should set the value to null if breach/recall or letter have not been selected', () => {
    const res = buildResponse()
    getNotePrepend(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.notePrepend).toBeNull()
  })
  it('should set the correct value if breach/recall initiated by CASE_ADMIN action has been selected and sentence type is COMMUNITY', () => {
    const res = buildResponse({ breachNSICreatedBy: 'CASE_ADMIN' })
    getNotePrepend(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.notePrepend).toEqual('Case administrator will initiate the breach')
  })
  it('should set the correct value if breach/recall initiated by USER action has been selected and sentence type is CUSTODY', () => {
    const res = buildResponse({ breachNSICreatedBy: 'USER', sentenceType: 'CUSTODY' })
    getNotePrepend(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.notePrepend).toEqual('I will initiate the recall')
  })
  it('should set the correct value if letter sent by CASE_ADMIN and letter type is FIRST_WARNING_LETTER_SENT', () => {
    const res = buildResponse({ letterSentBy: 'CASE_ADMIN', letterType: 'FIRST_WARNING_LETTER_SENT' })
    getNotePrepend(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.notePrepend).toEqual('Case administrator will send a first warning letter')
  })
  it('should set the correct value if letter sent by USER and action is BREACH_LETTER_SENT', () => {
    const res = buildResponse({ letterSentBy: 'USER', letterType: 'BREACH_LETTER_SENT' })
    getNotePrepend(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.notePrepend).toEqual('I will send a breach warning letter')
  })
  it('should set the correct value if breach/recall initiated by USER, letter sent by CASE_ADMIN, letter type is FIRST_WARNING_LETTER_SENT and sentence type is CUSTODY', () => {
    const res = buildResponse({
      breachNSICreatedBy: 'USER',
      sentenceType: 'CUSTODY',
      letterSentBy: 'CASE_ADMIN',
      letterType: 'FIRST_WARNING_LETTER_SENT',
    })
    getNotePrepend(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.notePrepend).toEqual(
      'I will initiate the recall\nCase administrator will send a first warning letter',
    )
  })
})
