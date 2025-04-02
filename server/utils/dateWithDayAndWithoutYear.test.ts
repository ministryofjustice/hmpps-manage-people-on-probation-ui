import { dateWithDayAndWithoutYear } from '.'

describe('dateWithDayAndWithoutYear', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['Date string ', '2023-05-25T09:08:34.123', 'Thursday 25 May'],
  ])('%s dateWithDayAndWithoutYear(%s, %s)', (_: string, a: string, expected: string) => {
    expect(dateWithDayAndWithoutYear(a)).toEqual(expected)
  })
})
