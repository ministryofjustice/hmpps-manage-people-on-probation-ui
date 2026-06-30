import { dateWithYearShortMonth } from './dateWithYearShortMonth'

describe('utils/dateWithYearShortMonth', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['Date String ', '2024-08-25T09:08:34.123', '25 Aug 2024'],
    ['Date String ', '2026-05-12T15:18:36+01:00', '12 May 2026'],
  ])('%s dateWithYearShortMonth(%s, %s)', (_: string, a: string, expected: string) => {
    expect(dateWithYearShortMonth(a)).toEqual(expected)
  })
})
