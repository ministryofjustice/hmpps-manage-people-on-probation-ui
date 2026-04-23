import httpMocks from 'node-mocks-http'
import { getFailedToAttendOptions } from './getFailedToAttendOptions'
import { mockAppResponse } from '../../controllers/mocks'

const nextSpy = jest.fn()

const buildResponse = ({ isProbationPractitioner = false } = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      forename: 'Anton',
      isProbationPractitioner,
    },
  }
  return mockAppResponse(locals)
}

describe('/middleware/appointment-outcomes/getFailedToAttendOptions', () => {
  const req = httpMocks.createRequest()
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('should return the correct options if user is not probation practitioner', () => {
    const res = buildResponse()
    getFailedToAttendOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'SEND_LETTER' }),
        expect.objectContaining({ value: 'DECISION_PENDING', text: 'Decision pending Anton’s response' }),
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
        expect.objectContaining({ value: 'DECISION_PENDING', text: 'Decision pending Anton’s response' }),
        expect.objectContaining({ divider: 'or' }),
        expect.objectContaining({ value: 'DIFFERENT_ACTION' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(4)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
