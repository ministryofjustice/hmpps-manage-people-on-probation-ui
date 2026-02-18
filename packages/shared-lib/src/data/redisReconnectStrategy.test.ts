import { reconnectStrategy } from './redisReconnectStrategy'

jest.mock('../logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('reconnectStrategy', () => {
  it('should return the next delay', () => {
    expect(reconnectStrategy(0)).toEqual(20)
  })
})
