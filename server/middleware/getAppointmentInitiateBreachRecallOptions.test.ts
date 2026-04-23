import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../controllers/mocks'
import { getAppointmentInitiateBreachRecallOptions } from './getAppointmentInitiateBreachRecallOptions'
import { SentenceType } from '../data/model/sentenceDetails'
import { AppointmentEnforcementAction } from '../models/Appointments'

const buildResponse = ({
  sentenceType = 'COMMUNITY',
  enforcementAction = 'INITIATE_BREACH_RECALL',
} = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      sentence: { type: sentenceType },
      appointmentSession: {
        outcome: {
          enforcementAction,
        },
      },
    },
  }
  return mockAppResponse(locals)
}

const req = httpMocks.createRequest()

const checkOptions = ({
  sentenceType = 'COMMUNITY',
  enforcementAction = 'INITIATE_BREACH_RECALL',
}: { sentenceType?: SentenceType; enforcementAction?: AppointmentEnforcementAction } = {}) => {
  const text = sentenceType === 'COMMUNITY' ? 'breach' : 'recall'
  const res = buildResponse({ sentenceType, enforcementAction })
  const nextSpy = jest.fn()
  getAppointmentInitiateBreachRecallOptions(req, res, nextSpy)
  it(`should return the correct breach nsi sent by options for a ${sentenceType} sentence and ${enforcementAction} enforcement action`, () => {
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'CASE_ADMIN', text: 'Case administrator' }),
        expect.objectContaining({ value: 'USER', text: `I’ll initiate the ${text}` }),
      ]),
    )
  })
  if (enforcementAction === 'INITIATE_BREACH_RECALL') {
    it('should not define the options for sending an enforcement letter', () => {
      expect(res.locals.appointmentOutcome.letterSentByOptions).toBeUndefined()
      expect(res.locals.appointmentOutcome.letterTypeOptions).toBeUndefined()
    })
  } else {
    it('should return the correct enforcement letter sent by options', () => {
      expect(res.locals.appointmentOutcome.letterSentByOptions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ value: 'CASE_ADMIN', text: 'Case administrator' }),
          expect.objectContaining({ value: 'USER', text: `I’ll send the letter` }),
        ]),
      )
    })
    it('should return the correct enforcement letter type options', () => {
      expect(res.locals.appointmentOutcome.letterTypeOptions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ value: 'LICENCE_COMPLIANCE_LETTER', text: 'Licence compliance letter' }),
          expect.objectContaining({ value: 'DIFFERENT_ENFORCEMENT_LETTER', text: `A different enforcement letter` }),
        ]),
      )
    })
  }
  it('should return next()', () => {
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
}

describe('/middleware/getAppointmentInitiateBreachRecallOptions()', () => {
  checkOptions()
  checkOptions({ sentenceType: 'CUSTODY' })
  checkOptions({ enforcementAction: 'INITIATE_BREACH_RECALL_AND_SEND_LETTER' })
})
