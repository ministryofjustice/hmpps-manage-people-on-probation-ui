import httpMocks from 'node-mocks-http'
import { getFailedToAttendOptions } from './getFailedToAttendOptions'
import { mockAppResponse } from '../../controllers/mocks'
import { ContactEnforcementActions } from '../../data/model/schedule'
import { validEnforcementActionOptions } from '../../utils'
import { failedToAttendOptions } from '../../properties/appointment-outcomes'

const contactEnforcementActions: ContactEnforcementActions[] = [
  { code: 'IBR', description: 'Breach / Recall Initiated', defaultResponsePeriodDays: 7 },
  { code: 'ROM', description: 'Refer to Offender Manager', defaultResponsePeriodDays: 7 },
  { code: 'NFA', description: 'No Further Action', defaultResponsePeriodDays: 7 },
]

const nextSpy = jest.fn()

const buildResponse = ({ isProbationPractitioner = false } = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      forename: 'Anton',
      isProbationPractitioner,
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
  validEnforcementActionOptions: jest.fn(() => failedToAttendOptions('Anton')),
}))

const validEnforcementActionOptionsSpy = validEnforcementActionOptions as jest.MockedFunction<
  typeof validEnforcementActionOptions
>

describe('/middleware/appointment-outcomes/getFailedToAttendOptions', () => {
  const req = httpMocks.createRequest()
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('should return the correct options if user is not probation practitioner', () => {
    const res = buildResponse()
    getFailedToAttendOptions(req, res, nextSpy)
    expect(validEnforcementActionOptionsSpy).toHaveBeenCalledWith(
      contactEnforcementActions,
      failedToAttendOptions('Anton'),
    )
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'SEND_LETTER' }),
        expect.objectContaining({
          value: 'DECISION_PENDING_RESPONSE_FROM_PERSON_ON_PROBATION',
          text: 'Decision pending Anton’s response',
        }),
        expect.objectContaining({ value: 'REFER_TO_OFFENDER_MANAGER' }),
        expect.objectContaining({ divider: 'or' }),
        expect.objectContaining({ value: 'DIFFERENT_ACTION' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(5)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should return the correct options for a custody sentence and user is probation practitioner', () => {
    const res = buildResponse({ isProbationPractitioner: true })
    getFailedToAttendOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'SEND_LETTER' }),
        expect.objectContaining({
          value: 'DECISION_PENDING_RESPONSE_FROM_PERSON_ON_PROBATION',
          text: 'Decision pending Anton’s response',
        }),
        expect.objectContaining({ divider: 'or' }),
        expect.objectContaining({ value: 'DIFFERENT_ACTION' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(4)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
