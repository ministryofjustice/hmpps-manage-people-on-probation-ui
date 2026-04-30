import httpMocks from 'node-mocks-http'
import { getAttendedFailedToComplyOptions } from './getAttendedFailedToComplyOptions'
import { mockAppResponse } from '../../controllers/mocks'

const nextSpy = jest.fn()

const buildResponse = ({
  sentenceType = 'COMMUNITY',
  isProbationPractitioner = false,
} = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      sentence: { type: sentenceType },
      isProbationPractitioner,
    },
  }
  return mockAppResponse(locals)
}

describe('/middleware/appointment-outcomes/getAttendedFailedToComplyOptions', () => {
  const req = httpMocks.createRequest()
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('should return the correct options for a community sentence and user is not probation practitioner', () => {
    const res = buildResponse()
    getAttendedFailedToComplyOptions(req, res, nextSpy)
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
    getAttendedFailedToComplyOptions(req, res, nextSpy)
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
})
