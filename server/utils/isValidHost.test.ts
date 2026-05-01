import { isValidHost } from './isValidHost'

describe('utils/isValidHost', () => {
  const originalEnv = process.env
  const mockedDeliusHost = 'https://delius.example.com'
  const mockedArnsHost = 'https://arns.example.com'
  const mockedTierHost = 'https://tier.example.com'
  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.DELIUS_API_URL = mockedDeliusHost
    process.env.ARNS_API_URL = mockedArnsHost
    process.env.TIER_API_URL = mockedTierHost
  })
  afterEach(() => {
    process.env = originalEnv
  })
  it('should return true for a valid DELIUS_API_URL', () => {
    expect(isValidHost(mockedDeliusHost)).toBe(true)
  })
  it('should return true for a valid ARNS_API_URL', () => {
    expect(isValidHost(mockedArnsHost)).toBe(true)
  })
  it('should return true for a valid TIER_API_URL', () => {
    expect(isValidHost(mockedTierHost)).toBe(true)
  })
  it('returns false for an invalid host', () => {
    expect(isValidHost('https://invalid.example.com')).toBe(false)
  })

  it('returns false if one of the env vars is missing', () => {
    delete process.env.DELIUS_API_URL
    expect(isValidHost(mockedDeliusHost)).toBe(false)
  })
})
