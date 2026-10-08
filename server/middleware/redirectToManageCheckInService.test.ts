import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../controllers/mocks'
import config from '../config'
import { redirectToManageCheckInService } from './redirectToManageCheckInService'

const crn = 'X000001'
const id = 'f1654ea3-0abb-46eb-860b-654a96edbe20'
const { link } = config.eSupervisionManageCheckins
const path = `/case/${crn}/appointments/${id}/check-in/update`

const createReq = (query: Record<string, string> = {}, url = path) =>
  httpMocks.createRequest({ params: { crn, id }, query, originalUrl: url })

describe('redirectToManageCheckInService', () => {
  it('redirects to the manage check-ins service', () => {
    const res = mockAppResponse({})
    const redirectSpy = jest.spyOn(res, 'redirect')

    redirectToManageCheckInService(createReq(), res)

    expect(redirectSpy).toHaveBeenCalledWith(`${link}${path}`)
  })
  it.each([
    ['update', `/case/${crn}/appointments/${id}/check-in/update`],
    ['view', `/case/${crn}/appointments/${id}/check-in/view`],
    ['view-expired', `/case/${crn}/appointments/${id}/check-in/view-expired`],
    ['review/identity', `/case/${crn}/appointments/${id}/check-in/review/identity`],
    ['review/notes', `/case/${crn}/appointments/${id}/check-in/review/notes`],
    ['review/expired', `/case/${crn}/appointments/${id}/check-in/review/expired`],
  ])('passes the %s path through unchanged', (_: string, url: string) => {
    const res = mockAppResponse({})
    const redirectSpy = jest.spyOn(res, 'redirect')
    redirectToManageCheckInService(createReq({}, url), res)
    expect(redirectSpy).toHaveBeenCalledWith(`${link}${url}`)
  })
  it('makes the back url absolute so it returns to this service', () => {
    const res = mockAppResponse({})
    const redirectSpy = jest.spyOn(res, 'redirect')
    const backPath = `/case/${crn}/activity-log?page=1`
    redirectToManageCheckInService(createReq({ back: backPath }, `${path}?back=${encodeURIComponent(backPath)}`), res)
    const back = encodeURIComponent(`${config.domain}${backPath}`)
    expect(redirectSpy).toHaveBeenCalledWith(`${link}${path}?back=${back}`)
  })
  it.each([
    ['a protocol relative url', '//evil.example.com/phish'],
    ['an absolute url', 'https://evil.example.com/phish'],
    ['a value that is not a path', 'evil'],
  ])('drops the back param when it is %s', (_: string, back: string) => {
    const res = mockAppResponse({})
    const redirectSpy = jest.spyOn(res, 'redirect')
    redirectToManageCheckInService(createReq({ back }, `${path}?back=${encodeURIComponent(back)}`), res)
    expect(redirectSpy).toHaveBeenCalledWith(`${link}${path}`)
  })
})
