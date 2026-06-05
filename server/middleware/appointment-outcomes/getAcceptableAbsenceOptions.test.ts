import httpMocks from 'node-mocks-http'
import { getAcceptableAbsenceOptions } from './getAcceptableAbsenceOptions'
import { mockAppResponse } from '../../controllers/mocks'
import { ContactOutcome } from '../../data/model/schedule'
import { acceptableAbsenceOptions } from '../../properties/appointment-outcomes'
import { validOutcomeOptions } from '../../utils'

const contactOutcomes: ContactOutcome[] = [
  {
    code: 'AAME',
    description: 'Acceptable Absence - Medical',
    enforcementActions: [],
  },
  {
    code: 'AARE',
    description: 'Acceptable Absence - Religious',
    enforcementActions: [],
  },
]

const nextSpy = jest.fn()

const buildResponse = ({ sentenceLength = 12 } = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      sentence: { length: sentenceLength },
      appointmentSession: {
        outcome: {
          contactOutcomes,
        },
      },
    },
  }
  return mockAppResponse(locals)
}

jest.mock('../../utils', () => ({
  validOutcomeOptions: jest.fn(() => acceptableAbsenceOptions),
}))

const validOutcomeOptionsSpy = validOutcomeOptions as jest.MockedFunction<typeof validOutcomeOptions>

describe('/middleware/appointment-outcomes/getAcceptableAbsenceOptions', () => {
  const req = httpMocks.createRequest()
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('should return the correct options if sentence is over 24 months', () => {
    const res = buildResponse({ sentenceLength: 25 })
    getAcceptableAbsenceOptions(req, res, nextSpy)
    expect(validOutcomeOptionsSpy).toHaveBeenCalledWith(contactOutcomes, acceptableAbsenceOptions)
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_COURT_LEGAL' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_EMPLOYMENT' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_FAMILY_CHILDCARE' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_HOLIDAY' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_MEDICAL' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_RELIGIOUS' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_RIC' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_PROFESSIONAL_JUDGEMENT_DECISION' }),
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
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_COURT_LEGAL' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_EMPLOYMENT' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_FAMILY_CHILDCARE' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_HOLIDAY' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_MEDICAL' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_RELIGIOUS' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_RIC' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE_PROFESSIONAL_JUDGEMENT_DECISION' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(8)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
