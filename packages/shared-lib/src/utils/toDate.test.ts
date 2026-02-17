import { DateTime } from 'luxon'
import { toDate } from './toDate'

describe('utils/toDate', () => {
  it.each([
    ['null', undefined, null],
    ['null', null, null],
    ['null', '', null],
  ])('it should return %s', (_: string, a: string, expected: null) => {
    expect(toDate(a)).toEqual(expected)
  })
  it('should return a date', () => {
    const date = '2025-02-02'
    expect(toDate(date)).toEqual(DateTime.fromISO(date))
  })
})
