import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../../controllers/mocks'
import { getSendLetterOptions } from './getSendLetterOptions'
import { SentenceType } from '../../data/model/sentenceDetails'
import { AppointmentEnforcementAction, AppointmentSessionOutcome } from '../../models/Appointments'

interface Props {
  sentenceType?: SentenceType
  enforcementAction?: { [K in keyof AppointmentSessionOutcome]: AppointmentEnforcementAction }
  sendBreachOrRecallLetter?: boolean
  sendLetter?: boolean
}

const buildResponse = ({
  sentenceType = 'COMMUNITY',
  enforcementAction = {},
  sendBreachOrRecallLetter = false,
  sendLetter = false,
}: Props = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      sentence: { type: sentenceType },
      sendBreachOrRecallLetter,
      sendLetter,
      appointmentSession: {
        outcome: {
          ...enforcementAction,
        },
      },
    },
  }
  return mockAppResponse(locals)
}

const nextSpy = jest.fn()
const req = httpMocks.createRequest()

const checkLetterSentByOptions = (res: httpMocks.MockResponse<any>) => {
  expect(res.locals.appointmentOutcome.letterSentByOptions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ value: 'CASE_ADMIN', text: 'Case administrator' }),
      expect.objectContaining({ value: 'USER', text: `I’ll send the letter` }),
    ]),
  )
  expect(res.locals.appointmentOutcome.letterSentByOptions).toHaveLength(2)
}

describe('/middleware/appointment-outcomes/getSendLetterOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should define the correct options if enforcement action is BREACH_RECALL_INITIATED_AND_SEND_LETTER', () => {
    const res = buildResponse({ sendBreachOrRecallLetter: true })
    getSendLetterOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.letterTypeOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'LICENCE_COMPLIANCE_LETTER_SENT', text: 'Licence compliance letter' }),
        expect.objectContaining({ value: 'OTHER_ENFORCEMENT_LETTER_SENT', text: `A different enforcement letter` }),
      ]),
    )
    expect(res.locals.appointmentOutcome.letterTypeOptions).toHaveLength(2)
    checkLetterSentByOptions(res)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should define the correct options if enforcement action is SEND_LETTER and sentence type is CUSTODY', () => {
    const res = buildResponse({ sentenceType: 'CUSTODY', sendLetter: true })
    getSendLetterOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.letterTypeOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'LICENCE_COMPLIANCE_LETTER_SENT', text: 'Licence compliance letter' }),
        expect.objectContaining({ value: 'OTHER_ENFORCEMENT_LETTER_SENT', text: `A different enforcement letter` }),
      ]),
    )
    expect(res.locals.appointmentOutcome.letterTypeOptions).toHaveLength(2)
    checkLetterSentByOptions(res)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should define the correct options if enforcement action is SEND_LETTER and sentence type is COMMUNITY', () => {
    const res = buildResponse({ sendLetter: true, sentenceType: 'COMMUNITY' })
    getSendLetterOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.letterTypeOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'FIRST_WARNING_LETTER_SENT', text: 'First warning letter' }),
        expect.objectContaining({ value: 'BREACH_LETTER_SENT', text: 'Breach warning letter' }),
        expect.objectContaining({ value: 'OTHER_ENFORCEMENT_LETTER_SENT', text: `A different enforcement letter` }),
      ]),
    )
    expect(res.locals.appointmentOutcome.letterTypeOptions).toHaveLength(3)
    checkLetterSentByOptions(res)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  const sentenceTypes: SentenceType[] = ['PSS', 'YOUTH_CUSTODY']
  sentenceTypes.forEach(sentenceType => {
    it(`should define the correct options if enforcement action is SEND_LETTER and sentence type is ${sentenceType}`, () => {
      const res = buildResponse({ sendLetter: true, sentenceType })
      getSendLetterOptions(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.letterTypeOptions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ value: 'FIRST_WARNING_LETTER_SENT', text: 'First warning letter' }),
          expect.objectContaining({ value: 'SECOND_WARNING_LETTER_SENT', text: 'Second warning letter' }),
          expect.objectContaining({ value: 'BREACH_LETTER_SENT', text: 'Breach warning letter' }),
          expect.objectContaining({ value: 'OTHER_ENFORCEMENT_LETTER_SENT', text: `A different enforcement letter` }),
        ]),
      )
      expect(res.locals.appointmentOutcome.letterTypeOptions).toHaveLength(4)
      checkLetterSentByOptions(res)
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
})
