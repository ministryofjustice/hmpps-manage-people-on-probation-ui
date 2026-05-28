import httpMocks from 'node-mocks-http'
import { getAttendedFailedToComplyOptions } from './getAttendedFailedToComplyOptions'
import { mockAppResponse } from '../../controllers/mocks'
import { ContactEnforcementAction, ContactOutcome } from '../../data/model/schedule'
import { validEnforcementActionOptions } from '../../utils'
import { attendedFailedToComplyOptions } from '../../properties/appointment-outcomes'

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

const nextSpy = jest.fn()

const buildResponse = ({
  sentenceType = 'COMMUNITY',
  isProbationPractitioner = false,
} = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      sentence: { type: sentenceType },
      isProbationPractitioner,
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
  validEnforcementActionOptions: jest.fn(),
}))

const validEnforcementActionOptionsSpy = validEnforcementActionOptions as jest.MockedFunction<
  typeof validEnforcementActionOptions
>

describe('/middleware/appointment-outcomes/getAttendedFailedToComplyOptions', () => {
  const req = httpMocks.createRequest()
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('should return the correct options for a community sentence and user is not probation practitioner', () => {
    const res = buildResponse()
    validEnforcementActionOptionsSpy.mockReturnValueOnce(attendedFailedToComplyOptions('COMMUNITY'))
    getAttendedFailedToComplyOptions(req, res, nextSpy)
    expect(validEnforcementActionOptionsSpy).toHaveBeenCalledWith(
      contactOutcomes,
      attendedFailedToComplyOptions('COMMUNITY'),
    )
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'SEND_LETTER' }),
        expect.objectContaining({ value: 'BREACH_RECALL_INITIATED', text: 'Initiate a breach' }),
        expect.objectContaining({
          value: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
          text: 'Initiate a breach and send a letter',
        }),
        expect.objectContaining({ value: 'REFER_TO_OFFENDER_MANAGER' }),
        expect.objectContaining({ value: 'NO_FURTHER_ACTION' }),
        expect.objectContaining({ divider: 'or' }),
        expect.objectContaining({ value: 'DIFFERENT_ACTION' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(7)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should return the correct options for a custody sentence and user is probation practitioner', () => {
    const res = buildResponse({ sentenceType: 'CUSTODY', isProbationPractitioner: true })
    validEnforcementActionOptionsSpy.mockReturnValueOnce(attendedFailedToComplyOptions('CUSTODY'))
    getAttendedFailedToComplyOptions(req, res, nextSpy)
    expect(validEnforcementActionOptionsSpy).toHaveBeenCalledWith(
      contactOutcomes,
      attendedFailedToComplyOptions('CUSTODY'),
    )
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'SEND_LETTER' }),
        expect.objectContaining({ value: 'BREACH_RECALL_INITIATED', text: 'Initiate a recall' }),
        expect.objectContaining({
          value: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
          text: 'Initiate a recall and send a letter',
        }),
        expect.objectContaining({ value: 'NO_FURTHER_ACTION' }),
        expect.objectContaining({ divider: 'or' }),
        expect.objectContaining({ value: 'DIFFERENT_ACTION' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(6)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should call next when appointmentOutcome does not exist', () => {
    const res = mockAppResponse({})

    getAttendedFailedToComplyOptions(req, res, nextSpy)

    expect(validEnforcementActionOptionsSpy).not.toHaveBeenCalled()
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })

  it('should call next when contactEnforcementActions does not exist', () => {
    const res = mockAppResponse({
      appointmentOutcome: {
        sentence: { type: 'COMMUNITY' },
        isProbationPractitioner: false,
        appointmentSession: {
          outcome: {},
        },
      },
    })

    getAttendedFailedToComplyOptions(req, res, nextSpy)

    expect(validEnforcementActionOptionsSpy).not.toHaveBeenCalled()
    expect(res.locals.appointmentOutcome.options).toBeUndefined()
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })

  it('should remove REFER_TO_OFFENDER_MANAGER when user is a probation practitioner', () => {
    const res = buildResponse({
      sentenceType: 'COMMUNITY',
      isProbationPractitioner: true,
    })

    validEnforcementActionOptionsSpy.mockReturnValueOnce(attendedFailedToComplyOptions('COMMUNITY'))

    getAttendedFailedToComplyOptions(req, res, nextSpy)

    expect(res.locals.appointmentOutcome.options).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'REFER_TO_OFFENDER_MANAGER' })]),
    )

    expect(nextSpy).toHaveBeenCalledTimes(1)
  })

  it('should retain REFER_TO_OFFENDER_MANAGER when user is not a probation practitioner', () => {
    const res = buildResponse({
      sentenceType: 'COMMUNITY',
      isProbationPractitioner: false,
    })

    validEnforcementActionOptionsSpy.mockReturnValueOnce(attendedFailedToComplyOptions('COMMUNITY'))

    getAttendedFailedToComplyOptions(req, res, nextSpy)

    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'REFER_TO_OFFENDER_MANAGER' })]),
    )

    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
