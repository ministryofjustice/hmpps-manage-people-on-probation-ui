import nock from 'nock'
import config from '../config'
import { isValidHost, isValidPath } from '../utils'
import TierApiClient from './tierApiClient'

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    isValidPath: jest.fn(),
    isValidHost: jest.fn(),
  }
})

const mockedIsValidPath = isValidPath as jest.MockedFunction<typeof isValidPath>
const mockedIsValidHost = isValidHost as jest.MockedFunction<typeof isValidHost>

jest.mock('./tokenStore/redisTokenStore')

const token = { access_token: 'token-1', expires_in: 300 }

describe('tierApiClient', () => {
  let fakeTierApiClient: nock.Scope
  let tierApiClient: TierApiClient

  beforeEach(() => {
    jest.clearAllMocks()
    fakeTierApiClient = nock(config.apis.tierApi.url)
    tierApiClient = new TierApiClient(token.access_token)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll() // Removes all interceptors
    nock.restore() // Restores http/https modules
    nock.activate() // Re-activate for the next test
  })

  describe('getCalculationDetails', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    it('should return data from api', async () => {
      const response = { data: 'data' }
      const crn = 'X180888'
      mockedIsValidHost.mockReturnValue(true)
      mockedIsValidPath.mockReturnValue(true)
      fakeTierApiClient
        .get(`/crn/${crn}/tier/details`)
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await tierApiClient.getCalculationDetails(crn)
      expect(output).toEqual(response)
    })
  })

  describe('getTiers', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    it('should return data from api', async () => {
      const response = { data: 'data' }
      const crns = ['X180888']
      mockedIsValidHost.mockReturnValue(true)
      mockedIsValidPath.mockReturnValue(true)
      fakeTierApiClient
        .post(`/v2/crns/tier`)
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await tierApiClient.getTiers(crns)
      expect(output).toEqual(response)
    })
  })
})
