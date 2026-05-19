import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../../controllers/mocks'
import { getEnforcementActionOptions } from './getEnforcementActionOptions'
import { ContactEnforcementActions } from '../../data/model/schedule'
import { enforcementActionOptions } from '../../properties/appointment-outcomes'
import { validEnforcementActionOptions } from '../../utils'

const contactEnforcementActions: ContactEnforcementActions[] = [
  { code: 'IBR', description: 'Breach / Recall Initiated', defaultResponsePeriodDays: 7 },
  { code: 'ROM', description: 'Refer to Offender Manager', defaultResponsePeriodDays: 7 },
  { code: 'NFA', description: 'No Further Action', defaultResponsePeriodDays: 7 },
]

const buildResponse = (): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      forename: 'Alton',
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
  validEnforcementActionOptions: jest.fn(() => enforcementActionOptions('Alton')),
}))

const validEnforcementActionOptionsSpy = validEnforcementActionOptions as jest.MockedFunction<
  typeof validEnforcementActionOptions
>
const nextSpy = jest.fn()
const req = httpMocks.createRequest()

describe('/middleware/appointment-outcomes/getEnforcementActionOptions', () => {
  it('should define the correct options', () => {
    const res = buildResponse()
    getEnforcementActionOptions(req, res, nextSpy)
    expect(validEnforcementActionOptionsSpy).toHaveBeenCalledWith(
      contactEnforcementActions,
      enforcementActionOptions('Alton'),
    )
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: 'Select enforcement action', value: '' }),
        expect.objectContaining({ value: 'BREACH_REQUESTED' }),
        expect.objectContaining({ value: 'BREACH_RECALL_INITIATED' }),
        expect.objectContaining({ value: 'BREACH_CONFIRMATION_SENT' }),
        expect.objectContaining({ value: 'BREACH_LETTER_SENT' }),
        expect.objectContaining({ value: 'BREACH_REQUEST_ACTIONED' }),
        expect.objectContaining({ value: 'SEND_CONFIRMATION_OF_BREACH' }),
        expect.objectContaining({ value: 'RECALL_REQUESTED' }),
        expect.objectContaining({ value: 'IMMEDIATE_BREACH_OR_RECALL' }),
        expect.objectContaining({ value: 'FIRST_WARNING_LETTER_SENT' }),
        expect.objectContaining({ value: 'SECOND_WARNING_LETTER_SENT' }),
        expect.objectContaining({ value: 'OTHER_ENFORCEMENT_LETTER_SENT' }),
        expect.objectContaining({ value: 'LICENCE_COMPLIANCE_LETTER_SENT' }),
        expect.objectContaining({ value: 'ENFORCEMENT_LETTER_REQUESTED' }),
        expect.objectContaining({ value: 'WITHDRAW_WARNING_LETTER' }),
        expect.objectContaining({
          text: 'Decision pending Alton’s response',
          value: 'DECISION_PENDING_RESPONSE_FROM_PERSON_ON_PROBATION',
        }),
        expect.objectContaining({ value: 'REFER_TO_OFFENDER_MANAGER' }),
        expect.objectContaining({ value: 'YOT_OM_NOTIFIED' }),
        expect.objectContaining({ value: 'NO_FURTHER_ACTION' }),
        expect.objectContaining({ value: 'WITHDRAWAL_OF_WARNING' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(20)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
