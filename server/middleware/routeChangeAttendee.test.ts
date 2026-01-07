import httpMocks from 'node-mocks-http'
import { routeChangeAttendee } from './routeChangeAttendee'

const nextSpy = jest.fn()

const res = httpMocks.createResponse()
const spy = jest.spyOn(res, 'redirect')
const crn = 'X000001'
const id = '12345'
const change = '/mock/change/url'

describe('middleware/routeChangeAttendee', () => {
  it('should route to change attendee page if change link is clicked', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id,
      },
      url: change,
      query: {
        change,
      },
    })

    routeChangeAttendee(req, res, nextSpy)
    expect(nextSpy).not.toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith(
      `/case/${crn}/arrange-appointment/${id}/attendance?change=${encodeURIComponent(req.url)}`,
    )
  })
  it('should call next() if continue button is clicked', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id,
      },
      query: {
        change,
      },
      url: change,
      body: {
        'submit-btn': '',
      },
    })
    routeChangeAttendee(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
