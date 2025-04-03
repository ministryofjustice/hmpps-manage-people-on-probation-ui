import { dateWithYearShortMonthAndTime } from './dateWithYearShortMonthAndTime'
import { govukTime } from './govukTime'

describe('dateWithYearShortMonthAndTime', () => {
  const dateStr = '2025-02-25T09:08:34.123'
  it.each([
    ['null', undefined, null],
    ['null', null, null],
    ['null', '', null],
    ['the formatted date and time', dateStr, `25 Feb 2025 at ${govukTime(dateStr)}`],
  ])('it should return %s', (_: string, a: string, expected: null) => {
    expect(dateWithYearShortMonthAndTime(a)).toEqual(expected)
  })
})
