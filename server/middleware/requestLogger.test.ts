import httpMocks from 'node-mocks-http'
import { EventEmitter } from 'events'
import logger from '../../logger'
import requestLogger from './requestLogger'

jest.mock('../../logger', () => ({
  debug: jest.fn(),
}))

describe('requestLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the incoming request and calls next', () => {
    const req = httpMocks.createRequest({ method: 'GET', url: '/case/X123456/appointments/appointment/1/manage' })
    const res = httpMocks.createResponse()
    const next = jest.fn()

    requestLogger()(req, res, next)

    expect(logger.debug).toHaveBeenCalledWith(
      { method: 'GET', path: '/case/X123456/appointments/appointment/1/manage' },
      'request received',
    )
    expect(next).toHaveBeenCalled()
  })

  it('logs the completed request with status and duration on finish', () => {
    const req = httpMocks.createRequest({ method: 'POST', url: '/case/X123456/appointments' })
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter })
    const next = jest.fn()

    requestLogger()(req, res, next)
    res.statusCode = 302
    res.emit('finish')

    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/case/X123456/appointments',
        status: 302,
      }),
      'request completed',
    )
  })

  it('logs the full handler chain from req.handlerTrace, populated by instrumentRouter()', () => {
    const req = httpMocks.createRequest({ method: 'GET', url: '/case/X123456/appointments/appointment/1/manage' })
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter })
    const next = jest.fn()

    // instrumentRouter() populates this as handlers actually execute - here we
    // simulate the result, including a mix of named and unnamed (factory-
    // returned) handlers from a router.all() registration (that req.route.stack
    // alone would have missed) and a router.get() registration, each prefixed
    // with the method that registered it.
    req.handlerTrace = ['all:unnamed#1', 'all:unnamed#2', 'get:namedMiddleware', 'get:unnamed#4']

    requestLogger()(req, res, next)
    res.emit('finish')

    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        handlers: ['all:unnamed#1', 'all:unnamed#2', 'get:namedMiddleware', 'get:unnamed#4'],
      }),
      'request completed',
    )
  })

  it.each(['/assets/css/app.css', '/assets/js/app.js', '/favicon.ico'])(
    'skips logging for static asset requests: %s',
    (path: string) => {
      const req = httpMocks.createRequest({ method: 'GET', url: path })
      const res = httpMocks.createResponse({ eventEmitter: EventEmitter })
      const next = jest.fn()

      requestLogger()(req, res, next)
      res.emit('finish')

      expect(logger.debug).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    },
  )
})
