import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../../controllers/mocks'
import { getSendLetterOptions } from './getSendLetterOptions'

const buildResponse = ({
  sentenceType = 'COMMUNITY',
  enforcementAction = 'INITIATE_BREACH_RECALL_AND_SEND_LETTER',
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
  it('should define the correct options if enforcement action is INITIATE_BREACH_RECALL_AND_SEND_LETTER', () => {
    const res = buildResponse()
    getSendLetterOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.letterTypeOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'LICENCE_COMPLIANCE_LETTER', text: 'Licence compliance letter' }),
        expect.objectContaining({ value: 'DIFFERENT_ENFORCEMENT_LETTER', text: `A different enforcement letter` }),
      ]),
    )
    expect(res.locals.appointmentOutcome.letterTypeOptions).toHaveLength(2)
    checkLetterSentByOptions(res)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should define the correct options if enforcement action is SEND_LETTER and sentence type is CUSTODY', () => {
    const res = buildResponse({ enforcementAction: 'SEND_LETTER', sentenceType: 'CUSTODY' })
    getSendLetterOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.letterTypeOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'LICENCE_COMPLIANCE_LETTER', text: 'Licence compliance letter' }),
        expect.objectContaining({ value: 'DIFFERENT_ENFORCEMENT_LETTER', text: `A different enforcement letter` }),
      ]),
    )
    expect(res.locals.appointmentOutcome.letterTypeOptions).toHaveLength(2)
    checkLetterSentByOptions(res)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should define the correct options if enforcement action is SEND_LETTER and sentence type is COMMUNITY', () => {
    const res = buildResponse({ enforcementAction: 'SEND_LETTER', sentenceType: 'COMMUNITY' })
    getSendLetterOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.letterTypeOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'FIRST_WARNING_LETTER', text: 'First warning letter' }),
        expect.objectContaining({ value: 'BREACH_WARNING_LETTER', text: 'Breach warning letter' }),
        expect.objectContaining({ value: 'DIFFERENT_ENFORCEMENT_LETTER', text: `A different enforcement letter` }),
      ]),
    )
    expect(res.locals.appointmentOutcome.letterTypeOptions).toHaveLength(3)
    checkLetterSentByOptions(res)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  ;['PSS', 'YOUTH_CUSTODY'].forEach(sentenceType => {
    it(`should define the correct options if enforcement action is SEND_LETTER and sentence type is ${sentenceType}`, () => {
      const res = buildResponse({ enforcementAction: 'SEND_LETTER', sentenceType })
      getSendLetterOptions(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.letterTypeOptions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ value: 'FIRST_WARNING_LETTER', text: 'First warning letter' }),
          expect.objectContaining({ value: 'SECOND_WARNING_LETTER', text: 'Second warning letter' }),
          expect.objectContaining({ value: 'BREACH_WARNING_LETTER', text: 'Breach warning letter' }),
          expect.objectContaining({ value: 'DIFFERENT_ENFORCEMENT_LETTER', text: `A different enforcement letter` }),
        ]),
      )
      expect(res.locals.appointmentOutcome.letterTypeOptions).toHaveLength(4)
      checkLetterSentByOptions(res)
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
})
