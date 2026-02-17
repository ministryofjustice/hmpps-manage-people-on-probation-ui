import { DateTime } from 'luxon'
import { dayOfWeek } from './dayOfWeek'

describe('utils/dayOfWeek', () => {
  it.each([
    ['Null', null, null],
    ['gets day', DateTime.fromSQL('2020-09-10').toString(), 'Thursday'],
  ])('%s dayOfWeek(%s, %s)', (_: string, a: string, expected: string) => {
    expect(dayOfWeek(a)).toEqual(expected)
  })
})
