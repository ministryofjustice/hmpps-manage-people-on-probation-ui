import httpMocks from 'node-mocks-http'
import { renderError } from './renderError'
import { StatusErrorCode, statusErrors } from '../properties'

const res = httpMocks.createResponse({
  locals: {},
})
const req = httpMocks.createRequest()
const statusSpy = jest.spyOn(res, 'status')
const renderSpy = jest.spyOn(res, 'render')

describe('middleware/renderError', () => {
  it.each([404, 500])('%s error', (status: StatusErrorCode) => {
    renderError(status)(req, res)
    expect(res.locals.title).toEqual(statusErrors[status].title)
    expect(res.locals.message).toEqual(statusErrors[status].message)
    expect(statusSpy).toHaveBeenCalledWith(status)
    expect(renderSpy).toHaveBeenCalledWith('pages/error')
  })
})
