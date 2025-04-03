import { DateTime } from 'luxon'
import { timeForSort } from './timeForSort'

describe('timeForSort', () => {
  it.each([
    ['converts correctly', DateTime.fromSQL('2017-05-15 09:24:15').toString(), 924],
    ['converts correctly', DateTime.fromSQL('2017-05-15 19:24:15').toString(), 1924],
    ['returns null', undefined, null],
  ])('%s timeForSort(%s)', (_: string, a: string, expected: number) => {
    expect(timeForSort(a)).toEqual(expected)
  })
})
