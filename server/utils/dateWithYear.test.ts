import { dateWithYear, dateToLongDate } from '.'

describe('utils/dateWithYear', () => {
  it.each([
    [null, null, ''],
    ['Empty string', '', ''],
    ['Date string ', '2023-05-25T09:08:34.123', '25 May 2023'],
  ])('%s dateWithYear(%s, %s)', (_: string, a: string, expected: string) => {
    expect(dateWithYear(a)).toEqual(expected)
  })
})

describe('utils/dateToLongDate', () => {
  it.each([
    [null, null, ''],
    ['Empty string', '', ''],
    ['Valid DMY', '29/11/2025', '29 November 2025'],
    ['Invalid format returns original', '29-11-2025', '29-11-2025'],
  ])('%s dateToLongDate(%s) => %s', (_: string, input: string, expected: string) => {
    expect(dateToLongDate(input as unknown as string)).toEqual(expected)
  })
})
