import { isValidHost } from './isValidHost'

describe('utils/isValidHost', () => {
  const originalEnv = process.env
  const mockedMasHost = 'https://mas.example.com'
  const mockedArnsHost = 'https://arns.example.com'
  const mockedTierHost = 'https://tier.example.com'
  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.MAS_API_URL = mockedMasHost
    process.env.ARNS_API_URL = mockedArnsHost
    process.env.TIER_API_URL = mockedTierHost
  })
  afterEach(() => {
    process.env = originalEnv
  })
  it('should return true for a valid MAS_API_URL', () => {
    expect(isValidHost(mockedMasHost)).toBe(true)
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
    delete process.env.MAS_API_URL
    expect(isValidHost(mockedMasHost)).toBe(false)
  })
})
