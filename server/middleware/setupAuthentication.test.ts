import express from 'express'
import passport, { deserializeUser, serializeUser } from 'passport'
import setUpAuth from './setUpAuthentication'
import auth from '../authentication/auth'

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

const useSpy = jest.spyOn(express.Router(), 'use')
const authInitSpy = jest.spyOn(auth, 'init')
describe('/middleware/setUpAuth', () => {
  beforeEach(() => {
    setUpAuth()
  })
  it('should', () => {
    expect(authInitSpy).toHaveBeenCalled()
    // expect(useSpy).toHaveBeenCalledWith(passport.initialize())
  })
})
