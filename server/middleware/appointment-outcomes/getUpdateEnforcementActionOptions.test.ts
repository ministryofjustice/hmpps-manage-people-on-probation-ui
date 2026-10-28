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
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each(['COMMUNITY', 'CUSTODY'] as SentenceType[])(
    `should define the correct options if current enforcement action is LETTER related and sentence type is %s`,
    sentenceType => {
      const res = buildResponse({ sentenceType })
      validEnforcementActionOptionsSpy.mockReturnValueOnce(updateEnforcementActionOptions(sentenceType))
      getUpdateEnforcementActionOptions(req, res, nextSpy)
      expect(validEnforcementActionOptionsSpy).toHaveBeenCalledWith(
        contactOutcomes,
        updateEnforcementActionOptions(sentenceType),
      )
      const expectedType = sentenceType === 'COMMUNITY' ? 'breach' : 'recall'
      expect(res.locals.appointmentOutcome.options).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ value: 'SEND_ANOTHER_LETTER' }),
          expect.objectContaining({ text: `Initiate a ${expectedType}`, value: 'BREACH_RECALL_INITIATED' }),
          expect.objectContaining({ value: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER' }),
          expect.objectContaining({ value: 'WITHDRAW_WARNING_LETTER' }),
          expect.objectContaining({ value: 'NO_FURTHER_ACTION' }),
          expect.objectContaining({ divider: 'or' }),
          expect.objectContaining({ value: 'DIFFERENT_ACTION' }),
        ]),
      )
      expect(res.locals.appointmentOutcome.options).toHaveLength(7)
      expect(nextSpy).toHaveBeenCalledTimes(1)
    },
  )

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
    it.each(['CUSTODY', 'COMMUNITY'])(
      `should define the correct options if current enforcement action is ${action} and sentence type is %s`,
      (sentenceType: SentenceType) => {
        const type = sentenceType === 'COMMUNITY' ? 'breach' : 'recall'
        const res = buildResponse({ action, sentenceType })
        validEnforcementActionOptionsSpy.mockReturnValueOnce(updateEnforcementActionOptions(sentenceType))
        getUpdateEnforcementActionOptions(req, res, nextSpy)
        expect(res.locals.appointmentOutcome.options).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ value: 'SEND_LETTER' }),
            expect.objectContaining({ text: `Initiate a ${type}`, value: 'BREACH_RECALL_INITIATED' }),
            expect.objectContaining({
              text: `Initiate a ${type} and send a letter`,
              value: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
            }),
            expect.objectContaining({ value: 'NO_FURTHER_ACTION' }),
            expect.objectContaining({ divider: 'or' }),
            expect.objectContaining({ value: 'DIFFERENT_ACTION' }),
          ]),
        )
        expect(res.locals.appointmentOutcome.options).toHaveLength(6)
      },
    )
  })

  it('should define the correct options if current enforcement action is RECALL related and sentence type is CUSTODY', () => {
    const currentRecallActions: AppointmentEnforcementAction[] = [
      'BREACH_RECALL_INITIATED',
      'RECALL_REQUESTED',
      'IMMEDIATE_BREACH_OR_RECALL',
    ]
    currentRecallActions.forEach(action => {
      const res = buildResponse({ action, sentenceType: 'CUSTODY', acceptableAbsence: false })
      validEnforcementActionOptionsSpy.mockReturnValueOnce(updateEnforcementActionOptions('CUSTODY'))
      getUpdateEnforcementActionOptions(req, res, nextSpy)
      if (action !== 'RECALL_REQUESTED') {
        expect(res.locals.appointmentOutcome.options).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ value: 'RECALL_REQUESTED' }),
            expect.objectContaining({ value: 'WITHDRAW_WARNING_LETTER' }),
            expect.objectContaining({ value: 'NO_FURTHER_ACTION' }),
            expect.objectContaining({ divider: 'or' }),
            expect.objectContaining({ value: 'DIFFERENT_ACTION' }),
          ]),
        )
        expect(res.locals.appointmentOutcome.options).toHaveLength(5)
      } else {
        expect(res.locals.appointmentOutcome.options).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ value: 'WITHDRAW_WARNING_LETTER' }),
            expect.objectContaining({ value: 'NO_FURTHER_ACTION' }),
            expect.objectContaining({ divider: 'or' }),
            expect.objectContaining({ value: 'DIFFERENT_ACTION' }),
          ]),
        )
        expect(res.locals.appointmentOutcome.options).toHaveLength(4)
      }
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
