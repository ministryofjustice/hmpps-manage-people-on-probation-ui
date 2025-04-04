import { DateTime } from 'luxon'
import { dateForSort } from './dateForSort'

describe('utils/dateForSort', () => {
  it.each([
    ['converts correctly', DateTime.fromSQL('2020-09-10', { zone: 'utc' }).toString(), 1599696000000],
    ['returns null', undefined, null],
  ])('%s dateForSort(%s)', (_: string, a: string, expected: number) => {
    expect(dateForSort(a)).toEqual(expected)
  })
})
