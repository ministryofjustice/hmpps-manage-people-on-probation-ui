import { DateTime } from 'luxon'
import httpMocks from 'node-mocks-http'
import { getAppointmentOutcomeEvidenceBy } from './getAppointmentOutcomeEvidenceBy'
import { mockAppResponse } from '../controllers/mocks'

const today = DateTime.now()
const mockResponseByDate: string | null = null

const buildResponse = ({ responseByDate = mockResponseByDate } = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      appointment: {
        enforcementAction: {
          responseByDate,
        },
      },
    },
  }
  return mockAppResponse(locals)
}

const nextSpy = jest.fn()

describe('/middleware/getAppointmentOutcomeEvidenceBy()', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('should return null if enforcement action evidence by period does not exist for appointment', () => {
    const req = httpMocks.createRequest()
    const res = buildResponse()
    getAppointmentOutcomeEvidenceBy(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.enforcementAction).toBeNull()
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should return the date and days remaining if enforcement action evidence by period exists for appointment and is today', () => {
    const req = httpMocks.createRequest()
    const responseByDate = today.toFormat('yyyy-MM-dd')
    const expectedDate = today.toFormat('d LLLL')
    const res = buildResponse({ responseByDate })
    getAppointmentOutcomeEvidenceBy(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.enforcementAction).toEqual({ responseByDate: expectedDate, responseByDays: 0 })
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should return the date and days remaining if enforcement action evidence by period exists for appointment and is 5 days from today', () => {
    const req = httpMocks.createRequest()
    const futureDate = today.plus({ days: 5 })
    const responseByDate = futureDate.toFormat('yyyy-MM-dd')
    const expectedDate = futureDate.toFormat('d LLLL')
    const res = buildResponse({ responseByDate })
    getAppointmentOutcomeEvidenceBy(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.enforcementAction).toEqual({ responseByDate: expectedDate, responseByDays: 5 })
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
