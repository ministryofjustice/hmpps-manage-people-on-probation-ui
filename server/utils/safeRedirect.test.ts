import { isLocalPath, safeRedirect } from './safeRedirect'

describe('safeRedirect', () => {
  it.each([
    ['a relative path', '/case/X000001/activity-log', true],
    ['a relative path with a query string', '/case/X000001/activity-log?page=1&view=compact', true],
    ['the root path', '/', true],
    ['a protocol-relative url', '//evil.com', false],
    ['a backslash protocol-relative url', '/\\evil.com', false],
    ['a tab before a protocol-relative url', '/\t//evil.com', false],
    ['a line feed before a protocol-relative url', '/\n//evil.com', false],
    ['a carriage return before a protocol-relative url', '/\r//evil.com', false],
    ['a CRLF before a protocol-relative url', '/\r\n//evil.com', false],
    ['a path containing a null byte', '/case/X000001\u0000', false],
    ['a path containing a DEL character', '/case/X000001\u007f', false],
    ['an absolute url', 'https://evil.com', false],
    // eslint-disable-next-line no-script-url
    ['a javascript url', 'javascript:alert(1)', false],
    ['a path without a leading slash', 'case/X000001', false],
    ['an empty string', '', false],
    ['undefined', undefined, false],
    ['null', null, false],
    ['an array', ['/a', '/b'], false],
  ])('isLocalPath(%s) returns the expected result', (_label, url, expected) => {
    expect(isLocalPath(url)).toBe(expected)
  })

  it('returns the url when it is a local path', () => {
    expect(safeRedirect('/case/X000001', '/fallback')).toBe('/case/X000001')
  })

  it('returns the fallback when the url is not a local path', () => {
    expect(safeRedirect('//evil.com', '/fallback')).toBe('/fallback')
    expect(safeRedirect(undefined, '/fallback')).toBe('/fallback')
  })

  it('defaults the fallback to /', () => {
    expect(safeRedirect('https://evil.com')).toBe('/')
  })
})
