import { matchesTimeoutPath, timeoutUrlPaths } from './checkTimeoutURL'

describe('matchesTimeoutPath', () => {
  it.each([
    '/contact/123/enforcements',
    '/contact/abc/enforcements',
    '/user/123/appointments',
    '/user/abc/appointments',
    '/user/123/homepage',
    '/user/abc/homepage',
  ])('returns true for matching path: %s', path => {
    expect(matchesTimeoutPath(path, timeoutUrlPaths)).toBe(true)
  })

  it.each(['/contact/123/enforcements?foo=bar', '/user/123/appointments?foo=bar', '/user/123/homepage?foo=bar'])(
    'ignores query parameters: %s',
    path => {
      expect(matchesTimeoutPath(path, timeoutUrlPaths)).toBe(true)
    },
  )

  it.each([
    '/contact/123',
    '/contact/123/enforcements/extra',
    '/contact/123/foo',
    '/user/123',
    '/user/123/appointment',
    '/user/123/appointments/extra',
    '/user/123/home',
    '/user/123/homepage/extra',
    '/other/123/homepage',
    '/',
    '',
  ])('returns false for non-matching path: %s', path => {
    expect(matchesTimeoutPath(path, timeoutUrlPaths)).toBe(false)
  })

  it('matches only one path segment for the dynamic value', () => {
    expect(matchesTimeoutPath('/contact/123/enforcements', timeoutUrlPaths)).toBe(true)

    expect(matchesTimeoutPath('/contact/123/456/enforcements', timeoutUrlPaths)).toBe(false)
  })

  it('uses the supplied config rather than the default config', () => {
    const config = {
      urls: ['^/custom/[^/]+$'],
    }

    expect(matchesTimeoutPath('/custom/123', config)).toBe(true)
    expect(matchesTimeoutPath('/user/123/homepage', config)).toBe(false)
  })

  it('returns false when the config contains no patterns', () => {
    expect(matchesTimeoutPath('/user/123/homepage', { urls: [] })).toBe(false)
  })
})
