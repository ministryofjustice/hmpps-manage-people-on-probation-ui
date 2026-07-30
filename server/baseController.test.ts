import { Request, Response } from 'express'
import baseController from './baseController'

jest.mock('./config', () => ({
  apis: {
    appInsights: {
      connectionString: 'test-connection-string',
    },
  },
}))

jest.mock('./utils/azureAppInsights', () => ({
  defaultName: jest.fn().mockReturnValue('test-role-name'),
  currentTraceId: jest.fn().mockReturnValue('test-trace-id'),
}))

describe('baseController', () => {
  const next = jest.fn()

  const getResponse = () => ({ locals: {} }) as unknown as Response

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sets applicationInsights details on res.locals', () => {
    const req = { url: '/' } as Request
    const res = getResponse()

    baseController()(req, res, next)

    expect(res.locals.applicationInsightsConnectionString).toBe('test-connection-string')
    expect(res.locals.applicationInsightsRoleName).toBe('test-role-name')
    expect(res.locals.applicationInsightsTraceId).toBe('test-trace-id')
  })

  it('sets home to true when the url has no path segments', () => {
    const req = { url: '/' } as Request
    const res = getResponse()

    baseController()(req, res, next)

    expect(res.locals.home).toBe(true)
    expect(res.locals.cases).toBe(false)
    expect(res.locals.search).toBe(false)
  })

  it('sets cases to true when the url starts with /case', () => {
    const req = { url: '/case/X123456/overview' } as Request
    const res = getResponse()

    baseController()(req, res, next)

    expect(res.locals.home).toBe(false)
    expect(res.locals.cases).toBe(true)
    expect(res.locals.search).toBe(false)
  })

  it('sets search to true when the url starts with /search', () => {
    const req = { url: '/search' } as Request
    const res = getResponse()

    baseController()(req, res, next)

    expect(res.locals.home).toBe(false)
    expect(res.locals.cases).toBe(false)
    expect(res.locals.search).toBe(true)
  })

  it('sets makePageTitle on res.locals', () => {
    const req = { url: '/' } as Request
    const res = getResponse()

    baseController()(req, res, next)

    expect(typeof res.locals.makePageTitle).toBe('function')
  })

  it('calls next', () => {
    const req = { url: '/' } as Request
    const res = getResponse()

    baseController()(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
  })
})
