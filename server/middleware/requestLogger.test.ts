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

  it('labels named handlers by name and unnamed (factory-returned) handlers by position', () => {
    const req = httpMocks.createRequest({ method: 'GET', url: '/case/X123456/appointments/appointment/1/manage' })
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter })
    const next = jest.fn()

    function namedMiddleware() {
      /* no-op stand-in for a real middleware */
    }
    // Express itself sets layer.name to the literal string "<anonymous>" for
    // middleware with no function name (not an empty string) - mirrored here.
    req.route = {
      path: '/case/:crn/appointments/appointment/:contactId/manage',
      stack: [{ name: '<anonymous>' }, { name: namedMiddleware.name }, { name: '<anonymous>' }],
    } as unknown as typeof req.route

    requestLogger()(req, res, next)
    res.emit('finish')

    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        handlers: ['unnamed#1', 'namedMiddleware', 'unnamed#3'],
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
