/* eslint-disable import/first */

jest.mock('./tokenStore/redisTokenStore')

jest.mock('../config', () => ({
  getConfig: jest.fn(),
}))

const mockedConfig = {
  apis: {
    hmppsAuth: {
      url: 'http://fake-hmpps-auth',
      timeout: 5000,
      systemClientId: 'client-id',
      systemClientSecret: 'client-secret',
    },
  },
}

import nock from 'nock'
import HmppsAuthClient from './hmppsAuthClient'
import TokenStore from './tokenStore/redisTokenStore'
import { getConfig } from '../config'

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const username = 'Bob'
const token = { access_token: 'token-1', expires_in: 300 }

describe('hmppsAuthClient', () => {
  let fakeHmppsAuthApi: nock.Scope
  let hmppsAuthClient: HmppsAuthClient

  beforeEach(() => {
    // Use the mocked config URL here
    jest.clearAllMocks()
    fakeHmppsAuthApi = nock(mockedConfig.apis.hmppsAuth.url)
    mockedGetConfig.mockReturnValue(mockedConfig)
    hmppsAuthClient = new HmppsAuthClient(tokenStore)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getSystemClientToken', () => {
    it('should instantiate the redis client', async () => {
      tokenStore.getToken.mockResolvedValue(token.access_token)
      await hmppsAuthClient.getSystemClientToken(username)
    })

    it('should return token from redis if one exists', async () => {
      tokenStore.getToken.mockResolvedValue(token.access_token)
      const output = await hmppsAuthClient.getSystemClientToken(username)
      expect(output).toEqual(token.access_token)
    })

    it('should return token from HMPPS Auth with username', async () => {
      tokenStore.getToken.mockResolvedValue(null)

      fakeHmppsAuthApi
        .post('/oauth/token', 'grant_type=client_credentials&username=Bob')
        .basicAuth({
          user: mockedConfig.apis.hmppsAuth.systemClientId,
          pass: mockedConfig.apis.hmppsAuth.systemClientSecret,
        })
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .reply(200, token)

      const output = await hmppsAuthClient.getSystemClientToken(username)
      expect(output).toEqual(token.access_token)
      expect(tokenStore.setToken).toHaveBeenCalledWith('Bob', token.access_token, 240)
    })

    it('should return token from HMPPS Auth without username', async () => {
      tokenStore.getToken.mockResolvedValue(null)

      fakeHmppsAuthApi
        .post('/oauth/token', 'grant_type=client_credentials')
        .basicAuth({
          user: mockedConfig.apis.hmppsAuth.systemClientId,
          pass: mockedConfig.apis.hmppsAuth.systemClientSecret,
        })
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .reply(200, token)

      const output = await hmppsAuthClient.getSystemClientToken()

      expect(output).toEqual(token.access_token)
      expect(tokenStore.setToken).toHaveBeenCalledWith('%ANONYMOUS%', token.access_token, 240)
    })
  })
})
