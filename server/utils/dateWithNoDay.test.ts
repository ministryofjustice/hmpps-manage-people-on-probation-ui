import { dateWithNoDay } from '.'

describe('dateWithNoDay', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['Date string ', '2023-05-25T09:08:34.123', 'May 2023'],
  ])('%s dateWithDayAndWithoutYear(%s, %s)', (_: string, a: string, expected: string) => {
    expect(dateWithNoDay(a)).toEqual(expected)
  })
})
