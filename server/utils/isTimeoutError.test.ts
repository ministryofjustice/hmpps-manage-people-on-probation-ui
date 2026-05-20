import isTimeoutError from './isTimeoutError'

describe('isTimeoutError', () => {
  it('returns true for ECONNABORTED', () => {
    expect(isTimeoutError({ code: 'ECONNABORTED' })).toBe(true)
  })

  it('returns true for ETIMEDOUT', () => {
    expect(isTimeoutError({ code: 'ETIMEDOUT' })).toBe(true)
  })

  it('returns true for superagent timeout message', () => {
    expect(isTimeoutError({ message: 'Timeout of 10000ms exceeded' })).toBe(true)
  })

  it('returns false for non-timeout errors', () => {
    expect(isTimeoutError({ code: 'ECONNRESET', message: 'Connection reset by peer' })).toBe(false)
  })

  it('returns false for undefined error', () => {
    expect(isTimeoutError(undefined)).toBe(false)
  })
})
