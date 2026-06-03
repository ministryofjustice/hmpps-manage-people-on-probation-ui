import { createClient, RedisClientType } from 'redis'
import logger from '../../logger'
import config from '../config'
import { reconnectStrategy } from './redisReconnectStrategy'

const url =
  config.redis.tls_enabled === 'true'
    ? `rediss://${config.redis.host}:${config.redis.port}`
    : `redis://${config.redis.host}:${config.redis.port}`

export const createRedisClient = (): RedisClientType => {
  const client = createClient({
    url,
    password: config.redis.password,
    socket: {
      reconnectStrategy: attempts => reconnectStrategy(attempts),
    },
  })

  client.on('error', (e: Error) => {
    logger.error('Redis client errorr', e)
  })

  return client
}
