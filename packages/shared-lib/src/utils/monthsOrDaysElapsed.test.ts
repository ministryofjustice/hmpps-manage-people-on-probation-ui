import { DateTime } from 'luxon'
import { monthsOrDaysElapsed } from './monthsOrDaysElapsed'

describe('utils/monthsOrDaysElapsed', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['Months elapsed ', DateTime.now().minus({ months: 309 }), '309 months'],
    ['Days elapsed ', DateTime.now().minus({ days: 5 }), '5 days'],
  ])('%s monthsOrDaysElapsed(%s, %s)', (_: string, a: string, expected: string) => {
    expect(monthsOrDaysElapsed(a)).toEqual(expected)
  })
})
