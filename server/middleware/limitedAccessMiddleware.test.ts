import httpMocks from 'node-mocks-http'
import limitedAccess from './limitedAccessMiddleware'
import MasApiClient from '../data/masApiClient'
import type { AppResponse } from '../models/Locals'
import { services } from '../services'
import type { CaseAccess } from '../data/model/caseAccess'

jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const mockServices = services()

jest.spyOn(mockServices.hmppsAuthClient, 'getSystemClientToken').mockImplementation(() => Promise.resolve('token-1'))

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
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('User is excluded', () => {
    const mock = mockAccess({ userExcluded: true, exclusionMessage: 'user is excluded' })
    let spy: jest.SpyInstance
    beforeEach(async () => {
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
