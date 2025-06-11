import httpMocks from 'node-mocks-http'
import logger from '../../logger'
import populateCurrentUser from './populateCurrentUser'

import { UserService } from '../services'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { UserDetails } from '../services/userService'
import { AppResponse } from '../models/Locals'

const crn = 'X000001'
const username = 'user-1'

jest.mock('../services')
jest.mock('../data/manageUsersApiClient')

const manageUsersApiClient = new ManageUsersApiClient()
const userService = new UserService(manageUsersApiClient)
const nextSpy = jest.fn()
const loggerSpy = jest.spyOn(logger, 'info')

const mockUser: UserDetails = {
  username,
  name: 'Mock User',
  active: true,
  authSource: '',
  uuid: '',
  userId: '',
  activeCaseLoadId: '',
  displayName: '',
  roles: [],
}
const req = httpMocks.createRequest({
  params: {
    crn,
  },
})

const res = {
  locals: {
    user: {
      username,
      token: '1234',
    },
  },
  redirect: jest.fn().mockReturnThis(),
  render: jest.fn().mockReturnThis(),
} as unknown as AppResponse

describe('/middleware/populateCurrentUser()', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('If no user is returned from api', () => {
    let spy: jest.SpyInstance
    const expected = res.locals.user

    beforeEach(async () => {
      spy = jest.spyOn(userService, 'getUser').mockImplementationOnce(() => Promise.resolve(null))
      await populateCurrentUser(userService)(req, res, nextSpy)
    })
    it('should request the user from the api', () => {
      expect(spy).toHaveBeenCalledWith(res.locals.user.token)
    })
    it('should not change res.locals.user', () => {
      expect(res.locals.user).toEqual(expected)
    })
    it('should log that no user has been found', () => {
      expect(loggerSpy).toHaveBeenCalledWith('No user available')
    })
  })

  describe('If user is returned from api', () => {
    let spy: jest.SpyInstance
    beforeEach(async () => {
      spy = jest.spyOn(userService, 'getUser').mockImplementationOnce(() => Promise.resolve(mockUser))
      await populateCurrentUser(userService)(req, res, nextSpy)
    })
    it('should request the user from the api', () => {
      expect(spy).toHaveBeenCalledWith(res.locals.user.token)
    })
    it('should assign the user to res.locals.user', () => {
      expect(res.locals.user).toEqual({
        ...res.locals.user,
        ...mockUser,
      })
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })

  describe('If error returned', () => {
    const mockError = new Error('Error fetching user')
    const loggerErrorSpy = jest.spyOn(logger, 'error')
    beforeEach(async () => {
      jest.spyOn(userService, 'getUser').mockImplementationOnce(() => Promise.reject(mockError))
      await populateCurrentUser(userService)(req, res, nextSpy)
    })
    it('should log the error', () => {
      expect(loggerErrorSpy).toHaveBeenCalledWith(mockError, `Failed to retrieve user for: ${res.locals.user.username}`)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalledWith(mockError)
    })
  })
})
