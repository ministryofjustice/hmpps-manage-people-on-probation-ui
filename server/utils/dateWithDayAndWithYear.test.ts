import { dateWithDayAndWithYear } from '.'

describe('utils/dateWithDayAndWithYear', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['Date string ', '2023-05-25T09:08:34.123', 'Thursday 25 May 2023'],
  ])('%s dateWithDayAndWithYear(%s, %s)', (_: string, a: string, expected: string) => {
    expect(dateWithDayAndWithYear(a)).toEqual(expected)
  })
})
