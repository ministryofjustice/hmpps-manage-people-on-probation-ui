import { NextFunction, Request } from 'express'

import validateHost, { allowedHosts } from './validateHost'
import { AppResponse } from '../@types'

const getRequest = (host: string): Request => {
  const req = {
    get: jest.fn().mockReturnValue(host),
  } as Partial<Request> as Request
  return req
}

const res = {
  status: jest.fn().mockReturnThis(),
  send: jest.fn(),
} as Partial<AppResponse> as AppResponse

const nextSpy = jest.fn() as NextFunction

const checkValidHost = (validHost: boolean, reqHost?: string) => {
  const host = !validHost ? 'blocked.com' : reqHost
  it(`should ${!validHost ? 'block requests for an invalid host' : 'call next() for a valid host'}`, () => {
    const req = getRequest(host)
    validateHost()(req, res, nextSpy)
    if (!validHost) {
      expect(req.get).toHaveBeenCalledWith('host')
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.send).toHaveBeenCalledWith('Invalid host')
      expect(nextSpy).not.toHaveBeenCalled()
    } else {
      expect(res.status).not.toHaveBeenCalled()
      expect(res.send).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalled()
    }
  })
}

describe('middleware/validateHost', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  checkValidHost(false)
  let index = 0
  for (const host of allowedHosts) {
    checkValidHost(true, host)
    index += 1
  }
})
