/* eslint-disable import/first */
jest.mock('../applicationInfo', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    applicationName: 'manage-people-on-probation-ui',
    version: '1.0.0',
    buildNumber: 'build-123',
    gitRef: 'git-ref-123',
    gitShortHash: 'git-ref',
    productId: 'manage-people-on-probation-ui',
    branchName: 'branch-name-123',
  }),
}))

jest.mock('../config', () => ({
  __esModule: true,
  getConfig: jest.fn(),
}))

import httpMocks from 'node-mocks-http'
import populateCurrentUser from './populateCurrentUser'
import { UserService } from '../services'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { UserDetails } from '../services/userService'
import { AppResponse } from '../models/Locals'
import { getConfig } from '../config'

const crn = 'X000001'
const username = 'user-1'

jest.mock('../services')
jest.mock('../data/manageUsersApiClient')

const manageUsersApiClient = new ManageUsersApiClient()
const userService = new UserService(manageUsersApiClient)
const nextSpy = jest.fn()

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

const mockedConfig = {
  produiction: false,
  buildNumber: 'build-123',
  gitRef: 'git-ref-123',
  productId: 'manage-people-on-probation-ui',
  branchName: 'branch-name-123',
}

const mockedLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
} as any

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
mockedGetConfig.mockReturnValue(mockedConfig)

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
      expect(mockedLogger.info).toHaveBeenCalledWith('No user available')
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
    beforeEach(async () => {
      jest.spyOn(userService, 'getUser').mockImplementationOnce(() => Promise.reject(mockError))
      await populateCurrentUser(userService)(req, res, nextSpy)
    })
    it('should log the error', () => {
      expect(mockedLogger.error).toHaveBeenCalledWith(
        mockError,
        `Failed to retrieve user for: ${res.locals.user.username}`,
      )
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalledWith(mockError)
    })
  })
})
