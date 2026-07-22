import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../../controllers/mocks'
import { getUpdateEnforcementActionOptions } from './getUpdateEnforcementActionOptions'
import { AppointmentEnforcementAction } from '../../models/Appointments'
import { SentenceType } from '../../data/model/sentenceDetails'
import { ContactOutcome, ContactEnforcementAction } from '../../data/model/schedule'
import { updateEnforcementActionOptions } from '../../properties/appointment-outcomes'
import { validEnforcementActionOptions, setDataValue } from '../../utils'

const enforcementActions: ContactEnforcementAction[] = [
  { code: 'IBR', description: 'Breach / Recall Initiated', defaultResponsePeriodDays: 7 },
  { code: 'ROM', description: 'Refer to Offender Manager', defaultResponsePeriodDays: 7 },
  { code: 'NFA', description: 'No Further Action', defaultResponsePeriodDays: 7 },
]

const baseOutcomeUrl = '/base/outcome/url'
const crn = 'X000001'
const id = '12345'

const contactOutcomes: ContactOutcome[] = [
  {
    code: 'AFTC',
    description: 'Attended - Failed to Comply',
    enforcementActions,
  },
]

jest.mock('../../utils', () => {
  const actualUtils = jest.requireActual('../../utils')
  return {
    ...actualUtils,
    setDataValue: jest.fn(),
    validEnforcementActionOptions: jest.fn(),
  }
})

const setDataValueSpy = setDataValue as jest.MockedFunction<typeof setDataValue>

const buildResponse = ({
  action = 'FIRST_WARNING_LETTER_SENT',
  acceptableAbsence = false,
  sentenceType = 'COMMUNITY',
}: {
  action?: AppointmentEnforcementAction
  acceptableAbsence?: boolean
  sentenceType?: SentenceType
} = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      baseOutcomeUrl,
      crn,
      id,
      forename: 'Alton',
      currentEnforcementAction: {
        action,
      },
      appointment: {
        acceptableAbsence,
      },
      sentence: {
        type: sentenceType,
      },
      appointmentSession: {
        outcome: {
          contactOutcomes,
        },
      },
    },
  }
  return mockAppResponse(locals)
}

const validEnforcementActionOptionsSpy = validEnforcementActionOptions as jest.MockedFunction<
  typeof validEnforcementActionOptions
>

const nextSpy = jest.fn()
const req = httpMocks.createRequest({ session: { data: {} } })

describe('middleware/appointment-outcomes/getUpdateEnforcementActionOptions', () => {
  it('should define the correct options if current enforcement action is LETTER related', () => {
    const res = buildResponse()
    validEnforcementActionOptionsSpy.mockReturnValueOnce(updateEnforcementActionOptions('COMMUNITY'))
    getUpdateEnforcementActionOptions(req, res, nextSpy)
    expect(validEnforcementActionOptionsSpy).toHaveBeenCalledWith(
      contactOutcomes,
      updateEnforcementActionOptions('COMMUNITY'),
    )
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'SEND_ANOTHER_LETTER' }),
        expect.objectContaining({ text: 'Initiate a breach', value: 'BREACH_RECALL_INITIATED' }),
        expect.objectContaining({ value: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER' }),
        expect.objectContaining({ value: 'WITHDRAW_WARNING_LETTER' }),
        expect.objectContaining({ value: 'NO_FURTHER_ACTION' }),
        expect.objectContaining({ divider: 'or' }),
        expect.objectContaining({ value: 'DIFFERENT_ACTION' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(7)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })

  it('should define the correct options if current enforcement action is BREACH related and current action is BREACH_REQUESTED', () => {
    const res = buildResponse({ action: 'BREACH_REQUESTED' })
    validEnforcementActionOptionsSpy.mockReturnValueOnce(updateEnforcementActionOptions('COMMUNITY'))
    getUpdateEnforcementActionOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'BREACH_CONFIRMATION_SENT' }),
        expect.objectContaining({ value: 'BREACH_LETTER_SENT' }),
        expect.objectContaining({ value: 'BREACH_REQUEST_ACTIONED' }),
        expect.objectContaining({ value: 'WITHDRAW_WARNING_LETTER' }),
        expect.objectContaining({ value: 'NO_FURTHER_ACTION' }),
        expect.objectContaining({ divider: 'or' }),
        expect.objectContaining({ value: 'DIFFERENT_ACTION' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(7)
  })
  const currentActions: AppointmentEnforcementAction[] = [
    'DECISION_PENDING_RESPONSE',
    'REFER_TO_OFFENDER_MANAGER',
    'YOT_OM_NOTIFIED',
  ]

  currentActions.forEach(action => {
    it(`should define the correct options if current enforcement action is ${action} and sentence type is CUSTODY`, () => {
      const res = buildResponse({ action, sentenceType: 'CUSTODY' })
      validEnforcementActionOptionsSpy.mockReturnValueOnce(updateEnforcementActionOptions('CUSTODY'))
      getUpdateEnforcementActionOptions(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.options).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ value: 'SEND_LETTER' }),
          expect.objectContaining({ text: 'Initiate a recall', value: 'BREACH_RECALL_INITIATED' }),
          expect.objectContaining({
            text: 'Initiate a recall and send a letter',
            value: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
          }),
          expect.objectContaining({ value: 'NO_FURTHER_ACTION' }),
          expect.objectContaining({ divider: 'or' }),
          expect.objectContaining({ value: 'DIFFERENT_ACTION' }),
        ]),
      )
      expect(res.locals.appointmentOutcome.options).toHaveLength(6)
    })
  })

  it('should define the correct options if current outcome is ACCEPTABLE_ABSENCE', () => {
    const res = buildResponse({ acceptableAbsence: true })
    validEnforcementActionOptionsSpy.mockReturnValueOnce(updateEnforcementActionOptions('COMMUNITY'))
    getUpdateEnforcementActionOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'WITHDRAW_WARNING_LETTER' }),
        expect.objectContaining({ value: 'NO_FURTHER_ACTION' }),
        expect.objectContaining({ divider: 'or' }),
        expect.objectContaining({ value: 'DIFFERENT_ACTION' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(4)
  })

  it('should redirect to the other enforcement action page', () => {
    const res = buildResponse({ action: 'NO_FURTHER_ACTION' })
    const redirectSpy = jest.spyOn(res, 'redirect')
    validEnforcementActionOptionsSpy.mockReturnValueOnce(updateEnforcementActionOptions('COMMUNITY'))
    getUpdateEnforcementActionOptions(req, res, nextSpy)
    expect(redirectSpy).toHaveBeenCalledWith(`${baseOutcomeUrl}/enforcement-action`)
    expect(setDataValueSpy).toHaveBeenCalledWith(
      req.session.data,
      ['appointments', crn, id, 'outcome', 'redirectFromUpdate'],
      true,
    )
  })
})
