import nock from 'nock'

import config from '../config'
import ManageUsersApiClient from './manageUsersApiClient'
import { isValidHost, isValidPath } from '../utils'

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

describe('manageUsersApiClient', () => {
  let fakeManageUsersApiClient: nock.Scope
  let manageUsersApiClient: ManageUsersApiClient

  beforeEach(() => {
    jest.clearAllMocks()
    fakeManageUsersApiClient = nock(config.apis.manageUsersApi.url)
    manageUsersApiClient = new ManageUsersApiClient()
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getUser', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    it('should return data from api', async () => {
      const response = { data: 'data' }
      mockedIsValidHost.mockReturnValue(true)
      mockedIsValidPath.mockReturnValue(true)
      fakeManageUsersApiClient
        .get('/users/me')
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await manageUsersApiClient.getUser(token.access_token)
      expect(output).toEqual(response)
    })
  })
})
