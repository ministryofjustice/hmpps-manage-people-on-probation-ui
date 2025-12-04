import httpMocks from 'node-mocks-http'
import { isRescheduleAppointment } from './isRescheduleAppointment'

describe('middleware/isRescheduleAppointment', () => {
  it('should return false if req.query.change is undefined', () => {
    const req = httpMocks.createRequest({ query: {} })
    expect(isRescheduleAppointment(req)).toEqual(false)
  })
  it('should return false if reschedule directory does not exist is req.query.change', () => {
    const req = httpMocks.createRequest({
      query: {
        change:
          '/case/X756510/appointments/appointment/2510042440/d58022bc-d0c7-46b8-aa6f-39ad07741578/check-your-answers',
      },
    })
    expect(isRescheduleAppointment(req)).toEqual(false)
  })
  it('should return true if reschedule directory exists in req.query.change', () => {
    const req = httpMocks.createRequest({
      query: {
        change:
          '/case/X756510/appointments/reschedule/2510042440/d58022bc-d0c7-46b8-aa6f-39ad07741578/check-your-answers',
      },
    })
    expect(isRescheduleAppointment(req)).toEqual(true)
  })
})
