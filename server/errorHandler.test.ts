import type { Express } from 'express'
import request from 'supertest'
import { HTTPError } from 'superagent'
import httpMocks from 'node-mocks-http'
import { appWithAllRoutes } from './routes/testutils/appSetup'
import { statusErrors, type StatusErrorCode } from './properties'
import createErrorHandler from './errorHandler'
import logger from '../logger'
import { AppResponse } from './models/Locals'
import type { Services } from './services' // Required for typing the mock

const mockTechnicalUpdatesService = {
  getLatestTechnicalUpdateHeading: jest.fn(() => 'Mock Heading'),
  getTechnicalUpdates: jest.fn(),
}

const mockSearchService = {
  post: jest.fn((req, res, next) => next()),
  get: jest.fn((req, res, next) => next()),
}

const mockServices: Services = {
  technicalUpdatesService: mockTechnicalUpdatesService as any,
  searchService: mockSearchService as any,
} as unknown as Services

let app: Express

const req = httpMocks.createRequest({
  originalUrl: 'some/url',
})

const res = {
  locals: {
    user: {
      username: 'user-1',
    },
  },
  render: jest.fn().mockReturnThis(),
  redirect: jest.fn().mockReturnThis(),
  status: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const statusSpy = jest.spyOn(res, 'status')
const renderSpy = jest.spyOn(res, 'render')
const nextSpy = jest.fn()
const loggerErrorSpy = jest.spyOn(logger, 'error')

beforeEach(() => {
  app = appWithAllRoutes({ services: mockServices })
})

afterEach(() => {
  jest.resetAllMocks()
})

const mockError = (status = 500): HTTPError => {
  return {
    status,
    text: '',
    method: '',
    path: '',
    stack: 'mock-stack',
    name: '',
    message: 'Mock error message',
  }
}

const checkLocalsVars = (error: HTTPError, production = false): void => {
  it('should set res.locals correctly', () => {
    const { stack } = error
    const status = error?.status || 500
    const devError = `<pre>${error.stack}</pre>`
    expect(res.locals.title).toEqual(statusErrors[status as StatusErrorCode].title)
    expect(res.locals.message).toContain(`${statusErrors[status as StatusErrorCode].message}`)
    if (!production) {
      expect(res.locals.message).toContain(devError)
    } else {
      expect(res.locals.message).not.toContain(devError)
    }
    expect(res.locals.status).toEqual(status)
    expect(res.locals.stack).toEqual(production ? null : stack)
  })
}

describe('GET 404', () => {
  const { title, message } = statusErrors[404]
  it('should render content with stack in dev mode', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(response => {
        expect(response.text).toContain(title)
        expect(response.text).toContain(message)
        expect(response.text).toContain('NotFoundError: Not Found')
      })
  })

  it('should render content without stack in production mode', () => {
    return request(appWithAllRoutes({ production: true, services: mockServices }))
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(response => {
        expect(response.text).toContain(title)
        expect(response.text).toContain(message)
        expect(response.text).not.toContain('NotFoundError: Not Found')
      })
  })
})

describe('500 Error', () => {
  const error = mockError()
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('dev mode', () => {
    const production = false
    beforeEach(() => {
      createErrorHandler(production)(error, req, res, nextSpy)
    })
    it('should log an error', () => {
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`,
        error,
      )
    })
    checkLocalsVars(error, production)
    it('should set the response status', () => {
      expect(statusSpy).toHaveBeenCalledWith(error.status)
    })
    it('should render the error page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/error')
    })
  })
  describe('production', () => {
    const production = true
    beforeEach(() => {
      createErrorHandler(production)(error, req, res, nextSpy)
    })
    checkLocalsVars(error, production)
    it('should set the response status', () => {
      expect(statusSpy).toHaveBeenCalledWith(error.status)
    })
  })
})
describe('404 Error', () => {
  const error = mockError(404)
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('dev mode', () => {
    const production = false
    beforeEach(() => {
      createErrorHandler(production)(error, req, res, nextSpy)
    })
    checkLocalsVars(error, production)
    it('should set the response status', () => {
      expect(statusSpy).toHaveBeenCalledWith(error.status)
    })
  })
  describe('production', () => {
    const production = true
    beforeEach(() => {
      createErrorHandler(production)(error, req, res, nextSpy)
    })
    checkLocalsVars(error, production)

    it('should set the response status', () => {
      expect(statusSpy).toHaveBeenCalledWith(error.status)
    })
    it('should render the error page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/error')
    })
  })
})
describe('401 Error', () => {
  const error = mockError(401)
  const production = true
  const loggerSpy = jest.spyOn(logger, 'info')
  const redirectSpy = jest.spyOn(res, 'redirect')
  afterEach(() => {
    jest.clearAllMocks()
  })
  beforeEach(() => {
    createErrorHandler(production)(error, req, res, nextSpy)
  })
  it('should log info', () => {
    expect(loggerSpy).toHaveBeenCalledWith('Logging user out')
  })
  it('should redirect to the sign out page', () => {
    expect(redirectSpy).toHaveBeenCalledWith('/sign-out')
  })
})
describe('403 Error', () => {
  const error = mockError(403)
  const production = true
  const loggerSpy = jest.spyOn(logger, 'info')
  const redirectSpy = jest.spyOn(res, 'redirect')
  afterEach(() => {
    jest.clearAllMocks()
  })
  beforeEach(() => {
    createErrorHandler(production)(error, req, res, nextSpy)
  })
  it('should log info', () => {
    expect(loggerSpy).toHaveBeenCalledWith('Logging user out')
  })
  it('should redirect to the sign out page', () => {
    expect(redirectSpy).toHaveBeenCalledWith('/sign-out')
  })
})
describe('Error has no status', () => {
  const error = mockError(undefined)
  const production = true
  afterEach(() => {
    jest.clearAllMocks()
  })
  beforeEach(() => {
    createErrorHandler(production)(error, req, res, nextSpy)
  })
  checkLocalsVars(error, production)
  it('should set the response status', () => {
    expect(statusSpy).toHaveBeenCalledWith(error.status)
  })
})
