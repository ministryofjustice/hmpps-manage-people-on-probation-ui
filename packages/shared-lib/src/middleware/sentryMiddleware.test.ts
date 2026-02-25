import httpMocks from 'node-mocks-http'
import { AppResponse } from '../models/Locals'
import { sentryMiddleware } from './sentryMiddleware'
import { getConfig } from '../config'

jest.mock('../config', () => ({
  getConfig: jest.fn(),
}))

const mockedConfig = {
  sentry: {
    dsn: '',
    loaderScriptId: '',
    tracesSampleRate: 0.05,
    replaySampleRate: 0.0,
    replayOnErrorSampleRate: 0.1,
  },
}

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
mockedGetConfig.mockReturnValue(mockedConfig)

const res = {
  locals: {
    user: {
      username: 'user-1',
    },
  },
  redirect: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const req = httpMocks.createRequest()

const nextSpy = jest.fn()

describe('/middleware/sentryMiddleware', () => {
  beforeEach(() => {
    sentryMiddleware()(req, res, nextSpy)
  })
  it('should assign the Sentry config to res.locals.sentry', () => {
    expect(res.locals.sentry).toEqual(mockedConfig.sentry)
  })
  it('should return next()', () => {
    expect(nextSpy).toHaveBeenCalled()
  })
})
