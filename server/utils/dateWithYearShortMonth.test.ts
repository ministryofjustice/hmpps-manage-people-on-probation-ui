import { dateWithYearShortMonth } from './dateWithYearShortMonth'

describe('date with year short month', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['Date String ', '2024-08-25T09:08:34.123', '25 Aug 2024'],
  ])('%s dateWithYearShortMonth(%s, %s)', (_: string, a: string, expected: string) => {
    expect(dateWithYearShortMonth(a)).toEqual(expected)
  })
})
