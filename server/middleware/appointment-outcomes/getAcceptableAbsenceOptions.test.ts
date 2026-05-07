import httpMocks from 'node-mocks-http'
import { getAcceptableAbsenceOptions } from './getAcceptableAbsenceOptions'
import { mockAppResponse } from '../../controllers/mocks'

const nextSpy = jest.fn()

const buildResponse = ({ sentenceLength = 12 } = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      sentence: { length: sentenceLength },
    },
  }
  return mockAppResponse(locals)
}

describe('/middleware/appointment-outcomes/getAcceptableAbsenceOptions', () => {
  const req = httpMocks.createRequest()
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('should return the correct options if sentence is over 24 months', () => {
    const res = buildResponse({ sentenceLength: 25 })
    getAcceptableAbsenceOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'COURT_LEGAL' }),
        expect.objectContaining({ value: 'EMPLOYMENT' }),
        expect.objectContaining({ value: 'FAMILY_CHILDCARE' }),
        expect.objectContaining({ value: 'HOLIDAY' }),
        expect.objectContaining({ value: 'MEDICAL' }),
        expect.objectContaining({ value: 'RELIGIOUS' }),
        expect.objectContaining({ value: 'RIC' }),
        expect.objectContaining({ value: 'PROFESSIONAL_JUDGEMENT_DECISION' }),
        expect.objectContaining({ value: 'ACCEPTABLE_FAILURE' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(9)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should return the correct options if sentence is 24 months or less', () => {
    const res = buildResponse({ sentenceLength: 12 })
    getAcceptableAbsenceOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'COURT_LEGAL' }),
        expect.objectContaining({ value: 'EMPLOYMENT' }),
        expect.objectContaining({ value: 'FAMILY_CHILDCARE' }),
        expect.objectContaining({ value: 'HOLIDAY' }),
        expect.objectContaining({ value: 'MEDICAL' }),
        expect.objectContaining({ value: 'RELIGIOUS' }),
        expect.objectContaining({ value: 'RIC' }),
        expect.objectContaining({ value: 'PROFESSIONAL_JUDGEMENT_DECISION' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(8)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
