import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../../controllers/mocks'
import { getSendLetterOptions } from './getSendLetterOptions'
import { SentenceType } from '../../data/model/sentenceDetails'
import { AppointmentEnforcementAction, AppointmentSessionOutcome } from '../../models/Appointments'
import { ContactOutcome, ContactEnforcementAction } from '../../data/model/schedule'
import { letterSentByOptions, letterTypeOptions } from '../../properties/appointment-outcomes'
import { validEnforcementActionOptions } from '../../utils'

interface Props {
  sentenceType?: SentenceType
  enforcementAction?: { [K in keyof AppointmentSessionOutcome]: AppointmentEnforcementAction }
  sendBreachOrRecallLetter?: boolean
  sendLetter?: boolean
  youth?: boolean
  pss?: boolean
}

const enforcementActions: ContactEnforcementAction[] = [
  { code: 'IBR', description: 'Breach / Recall Initiated', defaultResponsePeriodDays: 7 },
  { code: 'ROM', description: 'Refer to Offender Manager', defaultResponsePeriodDays: 7 },
  { code: 'NFA', description: 'No Further Action', defaultResponsePeriodDays: 7 },
]

const contactOutcomes: ContactOutcome[] = [
  {
    code: 'AFTC',
    description: 'Attended - Failed to Comply',
    enforcementActions,
  },
]

const buildResponse = ({
  sentenceType = 'COMMUNITY',
  sendBreachOrRecallLetter = false,
  sendLetter = false,
  youth = false,
  pss = false,
}: Props = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      sentence: { type: sentenceType, youth, pss },
      sendBreachOrRecallLetter,
      sendLetter,
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
  validEnforcementActionOptions: jest.fn(() => letterTypeOptions),
}))

const validEnforcementActionOptionsSpy = validEnforcementActionOptions as jest.MockedFunction<
  typeof validEnforcementActionOptions
>

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
  it('should set the correct options if action is BREACH_RECALL_INITIATED_AND_SEND_LETTER and sentence type is COMMUNITY', () => {
    const res = buildResponse({ sendBreachOrRecallLetter: true, sentenceType: 'COMMUNITY' })
    getSendLetterOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.letterTypeOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'BREACH_LETTER_SENT', text: 'Breach warning letter' }),
        expect.objectContaining({ value: 'OTHER_ENFORCEMENT_LETTER_SENT', text: `A different enforcement letter` }),
      ]),
    )
    expect(res.locals.appointmentOutcome.letterTypeOptions).toHaveLength(2)
    checkLetterSentByOptions(res)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the correct options if action is BREACH_RECALL_INITIATED_AND_SEND_LETTER and sentence type is CUSTODY', () => {
    const res = buildResponse({ sendBreachOrRecallLetter: true, sentenceType: 'CUSTODY' })
    getSendLetterOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.letterTypeOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'LICENCE_COMPLIANCE_LETTER_SENT', text: 'Licence compliance letter' }),
        expect.objectContaining({ value: 'OTHER_ENFORCEMENT_LETTER_SENT', text: `A different enforcement letter` }),
      ]),
    )
    expect(res.locals.appointmentOutcome.letterTypeOptions).toHaveLength(2)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the correct options if action is SEND_LETTER and sentence type is COMMUNITY and not YOUTH or PSS', () => {
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
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the correct options if action is SEND_LETTER and sentence type is COMMUNITY and is YOUTH', () => {
    const res = buildResponse({ sendLetter: true, sentenceType: 'COMMUNITY', youth: true, pss: false })
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
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the correct options if action is SEND_LETTER and sentence type is COMMUNITY and is PSS', () => {
    const res = buildResponse({ sendLetter: true, sentenceType: 'COMMUNITY', youth: false, pss: true })
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
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the correct options if action is SEND_LETTER and sentence type is CUSTODY and not YOUTH or PSS', () => {
    const res = buildResponse({ sendLetter: true, sentenceType: 'CUSTODY' })
    getSendLetterOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.letterTypeOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'FIRST_WARNING_LETTER_SENT', text: 'First warning letter' }),
        expect.objectContaining({ value: 'LICENCE_COMPLIANCE_LETTER_SENT', text: 'Licence compliance letter' }),
        expect.objectContaining({ value: 'OTHER_ENFORCEMENT_LETTER_SENT', text: `A different enforcement letter` }),
      ]),
    )
    expect(res.locals.appointmentOutcome.letterTypeOptions).toHaveLength(3)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the correct options if action is SEND_LETTER and sentence type is CUSTODY and is YOUTH', () => {
    const res = buildResponse({ sendLetter: true, sentenceType: 'CUSTODY', youth: true, pss: false })
    getSendLetterOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.letterTypeOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'FIRST_WARNING_LETTER_SENT', text: 'First warning letter' }),
        expect.objectContaining({ value: 'SECOND_WARNING_LETTER_SENT', text: 'Second warning letter' }),
        expect.objectContaining({ value: 'LICENCE_COMPLIANCE_LETTER_SENT', text: 'Licence compliance letter' }),
        expect.objectContaining({ value: 'OTHER_ENFORCEMENT_LETTER_SENT', text: `A different enforcement letter` }),
      ]),
    )
    expect(res.locals.appointmentOutcome.letterTypeOptions).toHaveLength(4)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the correct options if action is SEND_LETTER and sentence type is CUSTODY and is PSS', () => {
    const res = buildResponse({ sendLetter: true, sentenceType: 'CUSTODY', youth: false, pss: true })
    getSendLetterOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.letterTypeOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'FIRST_WARNING_LETTER_SENT', text: 'First warning letter' }),
        expect.objectContaining({ value: 'SECOND_WARNING_LETTER_SENT', text: 'Second warning letter' }),
        expect.objectContaining({ value: 'LICENCE_COMPLIANCE_LETTER_SENT', text: 'Licence compliance letter' }),
        expect.objectContaining({ value: 'OTHER_ENFORCEMENT_LETTER_SENT', text: `A different enforcement letter` }),
      ]),
    )
    expect(res.locals.appointmentOutcome.letterTypeOptions).toHaveLength(4)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })

  it('should not mutate the source letter option definitions', () => {
    const res = buildResponse({
      sendBreachOrRecallLetter: true,
      sentenceType: 'COMMUNITY',
    })

    getSendLetterOptions(req, res, nextSpy)

    // preserve display metadata while preventing mutation of shared option definitions
    expect(res.locals.appointmentOutcome.letterSentByOptions[0]).toHaveProperty(
      'hint.text',
      'You need to follow your local process to request a letter.',
    )

    res.locals.appointmentOutcome.letterSentByOptions[0].checked = 'checked'
    res.locals.appointmentOutcome.letterTypeOptions[0].checked = 'checked'

    expect(letterSentByOptions[0]).not.toHaveProperty('checked')
    expect(letterTypeOptions[0]).not.toHaveProperty('checked')
  })
})
