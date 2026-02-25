import { createRedisClient } from './redisClient'

import { getConfig } from '../config'

jest.mock('../config', () => ({
  getConfig: jest.fn(),
}))

const mockedConfig = {
  redis: { tls_enabled: 'true', host: 'localhost', port: 6379 },
}

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
mockedGetConfig.mockReturnValue(mockedConfig)

jest.mock('./redisReconnectStrategy', () => {
  const config = jest.requireActual('./redisReconnectStrategy')
  return {
    ...config,
    reconnectStrategy: jest.fn().mockImplementation(() => {
      return false
    }),
  }
})

describe('createRedisClient', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('createRedisClient without tls', async () => {
    mockedGetConfig.mockReturnValueOnce({
      redis: { tls_enabled: 'false', host: 'localhost', port: 6379 },
    })

    const client = createRedisClient()
    try {
      await client.connect()
    } catch (error) {
      expect(error.code).toEqual('ECONNREFUSED')
    }
  })
  it('createRedisClient with tls', async () => {
    mockedGetConfig.mockReturnValueOnce({
      redis: { tls_enabled: 'true', host: 'localhost', port: 6379 },
    })

    const client = createRedisClient()
    try {
      await client.connect()
    } catch (error) {
      expect(error.code).toEqual('ECONNREFUSED')
    }
  })
})
