import httpMocks from 'node-mocks-http'
import { AppResponse } from '../@types'
import sentryMiddleware from './sentryMiddleware'
import config from '../config'

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
    expect(res.locals.sentry).toEqual(config.sentry)
  })
  it('should return next()', () => {
    expect(nextSpy).toHaveBeenCalled()
  })
})
