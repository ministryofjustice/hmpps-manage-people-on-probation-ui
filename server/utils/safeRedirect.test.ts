import { isLocalPath, safeRedirect } from './safeRedirect'

describe('safeRedirect', () => {
  it.each([
    ['/case/X000001/activity-log', true],
    ['/case/X000001/activity-log?page=1&view=compact', true],
    ['/', true],
    ['//evil.com', false],
    ['/\\evil.com', false],
    ['https://evil.com', false],
    // eslint-disable-next-line no-script-url
    ['javascript:alert(1)', false],
    ['case/X000001', false],
    ['', false],
    [undefined, false],
    [null, false],
    [['/a', '/b'], false],
  ])('isLocalPath(%p) returns %p', (url, expected) => {
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
