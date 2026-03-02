import nock from 'nock'

import config from '../config'
import { isValidHost, isValidPath } from '../utils'
import DeliusClient from './deliusClient'

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    isValidPath: jest.fn(),
    isValidHost: jest.fn(),
  }
})
const mockedIsValidHost = isValidHost as jest.MockedFunction<typeof isValidHost>
const mockedIsValidPath = isValidPath as jest.MockedFunction<typeof isValidPath>

jest.mock('./tokenStore/redisTokenStore')

const token = { access_token: 'token-1', expires_in: 300 }

describe('deliusClient', () => {
  let fakeDeliusApiClient: nock.Scope
  let deliusClient: DeliusClient

  beforeEach(() => {
    jest.clearAllMocks()
    fakeDeliusApiClient = nock(config.apis.deliusApi.url)
    deliusClient = new DeliusClient(token.access_token)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getHomepage', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockedIsValidHost.mockReturnValue(true)
      mockedIsValidPath.mockReturnValue(true)
    })

    it.each([['getHomepage', '/user/USER/homepage', () => deliusClient.getHomepage('USER')]])(
      'it should call %s',
      async (_: string, url: string, func: () => Promise<any>) => {
        const response = { data: 'data' }
        fakeDeliusApiClient.get(url).matchHeader('authorization', `Bearer ${token.access_token}`).reply(200, response)

        const output = await func()
        expect(output).toEqual(response)
      },
    )
  })
})
