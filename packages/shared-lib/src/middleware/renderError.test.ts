import httpMocks from 'node-mocks-http'
import { renderError } from './renderError'
import { StatusErrorCode, statusErrors } from '../properties'
import { getConfig } from '../config'

jest.mock('../config', () => ({
  getConfig: jest.fn(),
}))

jest.mock('../logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

const mockLink = 'https://sentence-plan-dummy-url'

const mockedConfig = {
  sentencePlan: {
    link: mockLink,
  },
}

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
mockedGetConfig.mockReturnValue(mockedConfig)

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
