import httpMocks, { RequestMethod } from 'node-mocks-http'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse, userProviders } from '../controllers/mocks'
import { getUserOptions } from './getUserOptions'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const hmppsAuthClient = new HmppsAuthClient(tokenStore)
const nextSpy = jest.fn()

jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    setDataValue: jest.fn(),
  }
})

jest.mock('../utils/logSessionCacheChange', () => ({
  logSessionCacheChange: jest.fn(),
}))

const crn = 'X000001'
const uuid = 'a4615940-2808-4ab5-a8e0-feddecb8ae1a'
const loggedInUsername = 'user-1'
const providerCode = 'N50'
const teamCode = 'N07IVH'
const username = 'user-1'

const buildRequest = ({ req = {}, params = {}, query = {}, user = {}, data = {} } = {}): httpMocks.MockRequest<any> => {
  const request = {
    method: 'GET' as RequestMethod,
    params: {
      crn,
      id: uuid,
      ...params,
    },
    query: {
      ...query,
    },
    session: {
      data: {
        appointments: {
          [crn]: {
            [uuid]: {
              user: {
                providerCode,
                teamCode,
                username,
                ...user,
              },
            },
          },
        },
        ...data,
      },
    },
    ...req,
  }
  return httpMocks.createRequest(request)
}

const res = mockAppResponse({ user: { username: loggedInUsername, teamCode, providerCode } })

const getUserProvidersSpy = jest
  .spyOn(MasApiClient.prototype, 'getUserProviders')
  .mockImplementation(() => Promise.resolve(userProviders))

describe('/middleware/getUserOptions()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('no query parameters are given', () => {
    const req = buildRequest()
    beforeEach(async () => {
      await getUserOptions(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should get providers for correct parameters', () => {
      expect(getUserProvidersSpy).toHaveBeenCalledWith(username, providerCode, teamCode)
    })
  })

  describe('provider code is given', () => {
    const providerCodeQuery = 'PC'
    const req = buildRequest({ query: { providerCode: providerCodeQuery } })
    beforeEach(async () => {
      await getUserOptions(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should get providers for correct parameters', () => {
      expect(getUserProvidersSpy).toHaveBeenCalledWith(username, providerCodeQuery, '')
    })
  })

  describe('team code is given', () => {
    const teamCodeQuery = 'PC'
    const req = buildRequest({ query: { teamCode: teamCodeQuery } })
    beforeEach(async () => {
      await getUserOptions(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should get providers for correct parameters', () => {
      expect(getUserProvidersSpy).toHaveBeenCalledWith(username, providerCode, teamCodeQuery)
    })
  })

  describe('provider and team code are given', () => {
    const providerCodeQuery = 'PC'
    const teamCodeQuery = 'PC'
    const req = buildRequest({ query: { providerCode: providerCodeQuery, teamCode: teamCodeQuery } })
    beforeEach(async () => {
      await getUserOptions(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should get providers for correct parameters', () => {
      expect(getUserProvidersSpy).toHaveBeenCalledWith(username, providerCodeQuery, teamCodeQuery)
    })
  })
})
