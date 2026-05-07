import httpMocks from 'node-mocks-http'
import logger from '../../logger'
import populateCurrentUser from './populateCurrentUser'

import { UserService } from '../services'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { UserDetails } from '../services/userService'
import { LocalsUser } from '../models/Locals'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { MasUserDetails } from '../models/Appointments'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse } from '../controllers/mocks'

const crn = 'X000001'
const username = 'user-1'

jest.mock('../services')
jest.mock('../data/manageUsersApiClient')

const manageUsersApiClient = new ManageUsersApiClient()
const userService = new UserService(manageUsersApiClient)
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const nextSpy = jest.fn()
const loggerSpy = jest.spyOn(logger, 'info')

const token = { access_token: 'token-1', expires_in: 300 }
jest.mock('../data/tokenStore/redisTokenStore')
jest
  .spyOn(HmppsAuthClient.prototype, 'getSystemClientToken')
  .mockImplementation(() => Promise.resolve(token.access_token))
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
tokenStore.getToken.mockResolvedValue(token.access_token)

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

const mockUserDetails: MasUserDetails = {
  userId: 1234,
  username: 'user-1',
  firstName: 'Mock',
  surname: 'User',
  email: 'mock.user@email.com',
  enabled: true,
  roles: [],
}

const mockLocalsUser: LocalsUser = {
  ...mockUserDetails,
  ...mockUser,
  userId: mockUserDetails.userId.toString(),
  active: true,
  name: 'Mock User',
  authSource: 'delius',
  uuid: 'uuid-1',
  displayName: 'Mock User',
  token: '123ABC',
}

const req = httpMocks.createRequest({
  params: {
    crn,
  },
})

const res = mockAppResponse({
  user: mockLocalsUser,
})

describe('/middleware/populateCurrentUser()', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('If no user is returned from api', () => {
    let getUserSpy: jest.SpyInstance
    let getUserDetailsSpy: jest.SpyInstance
    const localsUser: LocalsUser = { username: 'user-1', token: '1234', authSource: 'delius' }
    const expected = {
      ...mockUserDetails,
      ...localsUser,
      userId: mockUserDetails.userId.toString(),
    }
    const mockRes = mockAppResponse({ user: localsUser })

    beforeEach(async () => {
      getUserSpy = jest.spyOn(userService, 'getUser').mockResolvedValueOnce(null)
      getUserDetailsSpy = jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockResolvedValueOnce(mockUserDetails)
      await populateCurrentUser(userService, hmppsAuthClient)(req, mockRes, nextSpy)
    })
    it('should request the user from the api', () => {
      expect(getUserSpy).toHaveBeenCalledWith(localsUser.token)
    })
    it('should request the user details from the api', () => {
      expect(getUserDetailsSpy).toHaveBeenCalledWith(res.locals.user.username)
    })
    it('should not add the user to res.locals.user', () => {
      expect(mockRes.locals.user).toEqual(expected)
    })
    it('should log that no user has been found', () => {
      expect(loggerSpy).toHaveBeenCalledWith('No user available')
    })
  })

  describe('If no user details is returned from api', () => {
    let getUserDetailsSpy: jest.SpyInstance
    let getUserSpy: jest.SpyInstance

    const localsUser: LocalsUser = { username: 'user-1', token: '1234', authSource: 'delius' }
    const expected = {
      ...mockUser,
      ...localsUser,
    }
    const mockRes = mockAppResponse({
      user: localsUser,
    })
    beforeEach(async () => {
      getUserSpy = jest.spyOn(userService, 'getUser').mockImplementationOnce(() => Promise.resolve(mockUser))
      getUserDetailsSpy = jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockResolvedValueOnce(null)
      await populateCurrentUser(userService, hmppsAuthClient)(req, mockRes, nextSpy)
    })
    it('should request the user from the api', () => {
      expect(getUserSpy).toHaveBeenCalledWith(localsUser.token)
    })
    it('should request the user details from the api', () => {
      expect(getUserDetailsSpy).toHaveBeenCalledWith(res.locals.user.username)
    })
    it('should not add user details to res.locals.user', () => {
      expect(mockRes.locals.user).toEqual(expected)
    })
    it('should log that no user has been found', () => {
      expect(loggerSpy).toHaveBeenCalledWith('No user details available')
    })
  })

  describe('If no user or user details is returned from api', () => {
    let getUserDetailsSpy: jest.SpyInstance
    let getUserSpy: jest.SpyInstance

    const localsUser: LocalsUser = { username: 'user-1', token: '1234', authSource: 'delius' }
    const mockRes = mockAppResponse({
      user: localsUser,
    })
    beforeEach(async () => {
      getUserSpy = jest.spyOn(userService, 'getUser').mockImplementationOnce(() => Promise.resolve(null))
      getUserDetailsSpy = jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockResolvedValueOnce(null)
      await populateCurrentUser(userService, hmppsAuthClient)(req, mockRes, nextSpy)
    })
    it('should request the user from the api', () => {
      expect(getUserSpy).toHaveBeenCalledWith(localsUser.token)
    })
    it('should request the user details from the api', () => {
      expect(getUserDetailsSpy).toHaveBeenCalledWith(res.locals.user.username)
    })
    it('should not change res.locals.user', () => {
      expect(mockRes.locals.user).toEqual(localsUser)
    })
    it('should log that no user has been found', () => {
      expect(loggerSpy).toHaveBeenCalledWith('No user available')
      expect(loggerSpy).toHaveBeenCalledWith('No user details available')
    })
  })

  describe('If user is returned from api', () => {
    let spy: jest.SpyInstance
    beforeEach(async () => {
      spy = jest.spyOn(userService, 'getUser').mockImplementationOnce(() => Promise.resolve(mockUser))
      await populateCurrentUser(userService, hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the user from the api', () => {
      expect(spy).toHaveBeenCalledWith(res.locals.user.token)
    })
    it('should assign the user to res.locals.user', () => {
      expect(res.locals.user).toEqual(mockLocalsUser)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })

  describe('If user details with probation delivery units is returned from api', () => {
    const mockUserDetailsWithPdus: MasUserDetails = {
      ...mockUserDetails,
      staff: {
        probationDeliveryUnits: [
          { code: 'PDU001', description: 'Test PDU' },
          { code: 'PDU002', description: 'Another PDU' },
        ],
      },
    }
    const localsUser: LocalsUser = { username: 'user-1', token: '1234', authSource: 'delius' }
    const mockRes = mockAppResponse({ user: localsUser })

    beforeEach(async () => {
      jest.spyOn(userService, 'getUser').mockResolvedValueOnce(mockUser)
      jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockResolvedValueOnce(mockUserDetailsWithPdus)
      await populateCurrentUser(userService, hmppsAuthClient)(req, mockRes, nextSpy)
    })
    it('should assign probationDeliveryUnits to res.locals.user', () => {
      expect(mockRes.locals.user.probationDeliveryUnits).toEqual([
        { code: 'PDU001', description: 'Test PDU' },
        { code: 'PDU002', description: 'Another PDU' },
      ])
    })
  })

  describe('If error returned', () => {
    const mockError = new Error('Error fetching user')
    const loggerErrorSpy = jest.spyOn(logger, 'error')
    beforeEach(async () => {
      jest.spyOn(userService, 'getUser').mockImplementationOnce(() => Promise.reject(mockError))
      await populateCurrentUser(userService, hmppsAuthClient)(req, res, nextSpy)
    })
    it('should log the error', () => {
      expect(loggerErrorSpy).toHaveBeenCalledWith(mockError, `Failed to retrieve user for: ${res.locals.user.username}`)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalledWith(mockError)
    })
  })
})
