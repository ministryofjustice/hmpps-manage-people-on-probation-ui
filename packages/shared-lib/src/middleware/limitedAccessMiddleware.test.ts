/* eslint-disable import/first */

jest.mock('@ministryofjustice/probation-search-frontend/service/caseSearchService')
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

const mockDataAccess = {
  applicationInfo: '',
  hmppsAuthClient: {},
  manageUsersApiClient: {},
  probationFrontendComponentsApiClient: {},
}

jest.mock('../data', () => {
  const actualData = jest.requireActual('../data')
  return {
    ...actualData,
    dataAccess: jest.fn(() => mockDataAccess),
  }
})

jest.mock('../config', () => ({
  __esModule: true,
  getConfig: jest.fn(),
}))

jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    isValidCrn: jest.fn(),
  }
})

jest.mock('../logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

import httpMocks from 'node-mocks-http'
import { limitedAccess } from './limitedAccessMiddleware'
import MasApiClient from '../data/masApiClient'
import { AppResponse } from '../models/Locals'
import { services } from '../services'
import { CaseAccess } from '../data/model/caseAccess'
import { isValidCrn } from '../utils'
import { renderError } from './renderError'
import { getConfig } from '../config'

const mockMiddlewareFn = jest.fn()
jest.mock('./renderError', () => ({
  renderError: jest.fn(() => mockMiddlewareFn),
}))

const mockedConfig = {
  redis: {
    enabled: true,
  },
  buildNumber: '',
  gitRef: '',
  productId: '',
  branchName: '',
}

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>

const mockRenderError = renderError as jest.MockedFunction<typeof renderError>

const mockIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>

const crn = 'X000001'
const backLink = '/back/link'

const mockAccess = ({
  userExcluded = false,
  userRestricted = false,
  exclusionMessage = '',
  restrictionMessage = '',
}): CaseAccess => ({
  crn,
  userExcluded,
  userRestricted,
  exclusionMessage,
  restrictionMessage,
})

const req = httpMocks.createRequest({
  session: {
    backLink,
  },
  params: {
    crn,
  },
})

const res = {
  locals: {
    user: {
      username: 'user-1',
    },
  },
  redirect: jest.fn().mockReturnThis(),
  render: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const renderSpy = jest.spyOn(res, 'render')
const nextSpy = jest.fn()

describe('/middleware/limitedAccess', () => {
  let mockServices: ReturnType<typeof services>
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('crn url param is invalid', () => {
    let spy: jest.SpyInstance
    beforeEach(async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockedGetConfig.mockReturnValue(mockedConfig)
      mockServices = services()
      mockServices.hmppsAuthClient.getSystemClientToken = jest.fn()
      jest
        .spyOn(mockServices.hmppsAuthClient, 'getSystemClientToken')
        .mockImplementation(() => Promise.resolve('token-1'))

      limitedAccess(mockServices)(req, res, nextSpy)
    })
    it('should return a 404 status and render the error page', () => {
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })
  describe('User is excluded', () => {
    const mock = mockAccess({ userExcluded: true, exclusionMessage: 'user is excluded' })
    let spy: jest.SpyInstance
    beforeEach(async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockedGetConfig.mockReturnValue(mockedConfig)
      mockServices = services()
      mockServices.hmppsAuthClient.getSystemClientToken = jest.fn()
      jest.spyOn(mockServices.hmppsAuthClient, 'getSystemClientToken').mockResolvedValue('token-1')
      spy = jest.spyOn(MasApiClient.prototype, 'getUserAccess').mockImplementationOnce(() => Promise.resolve(mock))
      limitedAccess(mockServices)(req, res, nextSpy)
    })
    it('should request user access from the api', () => {
      expect(spy).toHaveBeenCalledWith(res.locals.user.username, req.params.crn)
    })
    it('should render the lao auth error page', () => {
      expect(renderSpy).toHaveBeenCalledWith('autherror-lao', { message: mock.exclusionMessage, backLink })
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })

  describe('User is restricted', () => {
    const mock = mockAccess({ userRestricted: true, restrictionMessage: 'user is restricted' })
    let spy: jest.SpyInstance
    beforeEach(async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockedGetConfig.mockReturnValue(mockedConfig)
      mockServices = services()
      mockServices.hmppsAuthClient.getSystemClientToken = jest.fn()
      jest
        .spyOn(mockServices.hmppsAuthClient, 'getSystemClientToken')
        .mockImplementation(() => Promise.resolve('token-1'))
      spy = jest.spyOn(MasApiClient.prototype, 'getUserAccess').mockImplementationOnce(() => Promise.resolve(mock))
      limitedAccess(mockServices)(req, res, nextSpy)
    })
    it('should request user access from the api', () => {
      expect(spy).toHaveBeenCalledWith(res.locals.user.username, req.params.crn)
    })
    it('should render the lao auth error page', () => {
      expect(renderSpy).toHaveBeenCalledWith('autherror-lao', { message: mock.restrictionMessage, backLink })
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
  describe('User is excluded but exclusion message does not exist', () => {
    const mock = mockAccess({ userExcluded: true, exclusionMessage: '' })
    let spy: jest.SpyInstance
    beforeEach(async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockedGetConfig.mockReturnValue(mockedConfig)
      mockServices = services()
      jest
        .spyOn(mockServices.hmppsAuthClient, 'getSystemClientToken')
        .mockImplementation(() => Promise.resolve('token-1'))
      spy = jest.spyOn(MasApiClient.prototype, 'getUserAccess').mockImplementationOnce(() => Promise.resolve(mock))
      limitedAccess(mockServices)(req, res, nextSpy)
    })
    it('should request user access from the api', () => {
      expect(spy).toHaveBeenCalledWith(res.locals.user.username, req.params.crn)
    })
    it('should render the lao auth error page', () => {
      expect(renderSpy).toHaveBeenCalledWith('autherror-lao', {
        message: 'You are not authorised to view this case.',
        backLink,
      })
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
  describe('User is not excluded or restricted', () => {
    const mock = mockAccess({ userExcluded: false, userRestricted: false })
    let spy: jest.SpyInstance
    beforeEach(async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockedGetConfig.mockReturnValue(mockedConfig)
      mockServices = services()
      jest
        .spyOn(mockServices.hmppsAuthClient, 'getSystemClientToken')
        .mockImplementation(() => Promise.resolve('token-1'))
      spy = jest.spyOn(MasApiClient.prototype, 'getUserAccess').mockImplementationOnce(() => Promise.resolve(mock))
      limitedAccess(mockServices)(req, res, nextSpy)
    })
    it('should request user access from the api', () => {
      expect(spy).toHaveBeenCalledWith(res.locals.user.username, req.params.crn)
    })
    it('should not render an error page', () => {
      expect(renderSpy).not.toHaveBeenCalled()
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })
})
