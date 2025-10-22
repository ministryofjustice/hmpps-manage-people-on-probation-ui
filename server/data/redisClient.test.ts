import { createRedisClient } from './redisClient'

jest.mock('../config', () => {
  const config = jest.requireActual('../config')
  return {
    ...config,
    redis: { tls_enabled: 'true', host: 'localhost', port: 6379 },
  }
})

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
  it.skip('createRedisClient without tls', async () => {
    jest.mock('../config', () => {
      const config = jest.requireActual('../config')
      return {
        ...config,
        redis: { tls_enabled: 'false', host: 'localhost', port: 6379 },
      }
    })
    const client = createRedisClient()
    try {
      await client.connect()
    } catch (error) {
      expect(error.code).toEqual('ECONNREFUSED')
    }
  })
  it.skip('createRedisClient with tls', async () => {
    jest.mock('../config', () => {
      const config = jest.requireActual('../config')
      return {
        ...config,
        redis: { tls_enabled: 'true', host: 'localhost', port: 6379 },
      }
    })
    const client = createRedisClient()
    try {
      await client.connect()
    } catch (error) {
      expect(error.code).toEqual('ECONNREFUSED')
    }
  })
})
