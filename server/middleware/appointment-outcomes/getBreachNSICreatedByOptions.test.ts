import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../../controllers/mocks'
import { getBreachNSICreatedByOptions } from './getBreachNSICreatedByOptions'

const buildResponse = ({ sentenceType = 'COMMUNITY' } = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      sentence: { type: sentenceType },
    },
  }
  return mockAppResponse(locals)
}

const req = httpMocks.createRequest()
const nextSpy = jest.fn()

describe('/middleware/appointment-outcomes/getBreachNSICreatedByOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should define the correct options if sentence type is COMMUNITY', () => {
    const res = buildResponse()
    getBreachNSICreatedByOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'CASE_ADMIN', text: 'Case administrator' }),
        expect.objectContaining({ value: 'USER', text: `I’ll initiate the breach` }),
      ]),
    )
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should define the correct options if sentence type is CUSTODY', () => {
    const res = buildResponse({ sentenceType: 'CUSTODY' })
    getBreachNSICreatedByOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'CASE_ADMIN', text: 'Case administrator' }),
        expect.objectContaining({ value: 'USER', text: `I’ll initiate the recall` }),
      ]),
    )
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
