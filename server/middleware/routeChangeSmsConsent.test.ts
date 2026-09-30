import httpMocks from 'node-mocks-http'
import { routeChangeSmsConsent } from './routeChangeSmsConsent'

const nextSpy = jest.fn()

const res = httpMocks.createResponse()
const spy = jest.spyOn(res, 'redirect')
const crn = 'X000001'
const id = '12345'
const change = '/mock/change/url'

describe('middleware/routeChangeSmsConsent', () => {
  it('should route to edit contact details page if change link is clicked', () => {
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
    routeChangeSmsConsent(req, res, nextSpy)
    expect(nextSpy).not.toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith(
      `/case/${crn}/personal-details/${id}/edit-contact-details?origin=allowSms&back=${req.url}`,
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
    routeChangeSmsConsent(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
