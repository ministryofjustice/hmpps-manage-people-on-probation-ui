import { getPositiveIntOr } from './getPositiveIntOr'

describe('utils/getPositiveIntOr', () => {
  const ENV_VAR = 'TEST_POSITIVE_INT_VAR'
  const originalValue = process.env[ENV_VAR]

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env[ENV_VAR]
    } else {
      process.env[ENV_VAR] = originalValue
    }
  })

  it('returns the parsed value when the env var is a positive integer', () => {
    process.env[ENV_VAR] = '3'
    expect(getPositiveIntOr(ENV_VAR, 7)).toEqual(3)
  })

  it('returns the fallback when the env var is missing', () => {
    delete process.env[ENV_VAR]
    expect(getPositiveIntOr(ENV_VAR, 7)).toEqual(7)
  })

  it('returns the fallback when the env var is non-numeric', () => {
    process.env[ENV_VAR] = 'not-a-number'
    expect(getPositiveIntOr(ENV_VAR, 7)).toEqual(7)
  })

  it('returns the fallback when the env var is zero', () => {
    process.env[ENV_VAR] = '0'
    expect(getPositiveIntOr(ENV_VAR, 7)).toEqual(7)
  })

  it('returns the fallback when the env var is negative', () => {
    process.env[ENV_VAR] = '-1'
    expect(getPositiveIntOr(ENV_VAR, 7)).toEqual(7)
  })

  it('returns the truncated integer when the env var is fractional', () => {
    process.env[ENV_VAR] = '1.5'
    expect(getPositiveIntOr(ENV_VAR, 7)).toEqual(1)
  })
})
