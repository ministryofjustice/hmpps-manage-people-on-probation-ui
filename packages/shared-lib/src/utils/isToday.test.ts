import { DateTime } from 'luxon'
import { isToday } from './isToday'

describe('utils/isToday', () => {
  it.each([
    ['Null', null, null],
    ['False', DateTime.now().plus({ days: 1 }).toString(), false],
    ['True', DateTime.now().toString(), true],
  ])('%s isToday(%s, %s)', (_: string, a: string, expected: boolean) => {
    expect(isToday(a)).toEqual(expected)
  })
})
