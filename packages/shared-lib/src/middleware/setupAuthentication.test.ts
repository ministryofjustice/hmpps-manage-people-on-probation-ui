import express, { Request, Response, NextFunction } from 'express'
import flash from 'connect-flash'
import passport from 'passport'
import { setUpAuthentication } from './setUpAuthentication'
import auth from '../authentication/auth'

jest.mock('express', () => {
  const actualExpress = jest.requireActual('express')
  return {
    ...actualExpress,
    Router: jest.fn(() => {
      return {
        use: jest.fn(),
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      }
    }),
  }
})

jest.mock('passport', () => ({
  initialize: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  use: jest.fn(),
  session: jest.fn(),
  authenticate: jest.fn(),
}))

jest.mock('../authentication/auth', () => ({
  init: jest.fn(),
}))

jest.mock('connect-flash', () => jest.fn(() => (req: Request, res: Response, next: NextFunction) => next()))

const authInitSpy = jest.spyOn(auth, 'init')
describe('/middleware/setUpAuthentication', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  let useSpy: jest.SpyInstance
  const mockRouter = (express.Router as jest.Mock).mock.results[0].value
  beforeEach(() => {
    useSpy = jest.spyOn(mockRouter, 'use')
    setUpAuthentication()
  })
  it('should initialise auth', () => {
    expect(authInitSpy).toHaveBeenCalled()
  })
  it('should initialise passport', () => {
    expect(useSpy).toHaveBeenCalledWith(passport.session())
    expect(useSpy).toHaveBeenCalledWith(passport.initialize())
  })
  it('should initialise flash', () => {
    expect(flash).toHaveBeenCalled()
  })
})
