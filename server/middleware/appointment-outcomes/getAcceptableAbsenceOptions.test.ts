import httpMocks from 'node-mocks-http'
import { getAcceptableAbsenceOptions } from './getAcceptableAbsenceOptions'
import { mockAppResponse } from '../../controllers/mocks'
import { ContactEnforcementActions } from '../../data/model/schedule'
import { validEnforcementActionOptions } from '../../utils'
import { acceptableAbsenceOptions } from '../../properties/appointment-outcomes'

const contactEnforcementActions: ContactEnforcementActions[] = [
  { code: 'IBR', description: 'Breach / Recall Initiated', defaultResponsePeriodDays: 7 },
  { code: 'ROM', description: 'Refer to Offender Manager', defaultResponsePeriodDays: 7 },
  { code: 'NFA', description: 'No Further Action', defaultResponsePeriodDays: 7 },
]

const nextSpy = jest.fn()

const buildResponse = ({ sentenceLength = 12 } = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      sentence: { length: sentenceLength },
      appointmentSession: {
        outcome: {
          contactEnforcementActions,
        },
      },
    },
  }
  return mockAppResponse(locals)
}

jest.mock('../../utils', () => ({
  validEnforcementActionOptions: jest.fn(() => acceptableAbsenceOptions),
}))

const validEnforcementActionOptionsSpy = validEnforcementActionOptions as jest.MockedFunction<
  typeof validEnforcementActionOptions
>

describe('/middleware/appointment-outcomes/getAcceptableAbsenceOptions', () => {
  const req = httpMocks.createRequest()
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('should return the correct options if sentence is over 24 months', () => {
    const res = buildResponse({ sentenceLength: 25 })
    getAcceptableAbsenceOptions(req, res, nextSpy)
    expect(validEnforcementActionOptionsSpy).toHaveBeenCalledWith(contactEnforcementActions, acceptableAbsenceOptions)
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
