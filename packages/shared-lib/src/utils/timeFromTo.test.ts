import { timeFromTo } from './timeFromTo'

describe('utils/timeFromTo', () => {
  it.each([
    ['Time from to', '2024-05-25T09:08:34.123', '2024-05-25T10:08:34.123', '9:08am to 10:08am'],
    ['Time from only', '2024-05-25T09:08:34.123', null, '9:08am'],
    ['Time to undefined', '2024-05-25T09:08:34.123', undefined, '9:08am'],
    ['Time to blank', '2024-05-25T09:08:34.123', '', '9:08am'],
  ])('%s timeFromTo(%s, %s)', (_: string, a: string, b: string, expected: string) => {
    expect(timeFromTo(a, b)).toEqual(expected)
  })
})
