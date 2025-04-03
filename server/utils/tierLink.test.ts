import { tierLink } from './tierLink'

describe('tierLink', () => {
  it.each([
    ['Returns empty', null, ''],
    ['Returns link', 'X000001', 'https://tier-dummy-url/X000001'],
  ])('%s tierLink(%s, %s)', (_: string, a: string, expected: string) => {
    expect(tierLink(a)).toEqual(expected)
  })
})
