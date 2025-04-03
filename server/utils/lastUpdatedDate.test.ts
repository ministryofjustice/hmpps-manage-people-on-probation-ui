import { lastUpdatedDate } from './lastUpdatedDate'

describe('lastUpdatedDate', () => {
  const dateStr = '2025-02-25T09:08:34.123'
  it.each([
    ['the last updated date', dateStr, 'Last updated 25 Feb 2025'],
    ['an empty string', null, ''],
    ['an empty string', undefined, ''],
    ['an empty string', '', ''],
  ])('it should return %s', (_: string, a: string, expected: null) => {
    expect(lastUpdatedDate(a)).toEqual(expected)
  })
})
