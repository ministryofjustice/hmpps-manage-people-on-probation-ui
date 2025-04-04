import { Name } from '../data/model/common'
import { lastUpdatedBy } from './lastUpdatedBy'

const mockName: Name = {
  forename: 'Joe',
  middleName: 'Arthur',
  surname: 'Bloggs',
}

const dateStr = '2025-02-25T09:08:34.123'

describe('utils/lastUpdatedBy', () => {
  it.each([
    ['the last updated by date', dateStr, `Last updated by Joe Bloggs on 25 Feb 2025`],
    ['an empty string', null, ''],
    ['an empty string', undefined, ''],
    ['an empty string', '', ''],
  ])('it should return %s', (_: string, a: string, expected: null) => {
    expect(lastUpdatedBy(a, mockName)).toEqual(expected)
  })
})
