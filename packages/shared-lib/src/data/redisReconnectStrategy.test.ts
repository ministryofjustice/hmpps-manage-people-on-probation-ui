import { reconnectStrategy } from './redisReconnectStrategy'

describe('reconnectStrategy', () => {
  it('should return the next delay', () => {
    expect(reconnectStrategy(0)).toEqual(20)
  })
})
