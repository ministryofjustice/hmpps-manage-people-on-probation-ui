import { DateTime } from 'luxon'
import { isInThePast } from './isInThePast'

describe('utils/isInThePast', () => {
  it.each([
    ['Null', null, null],
    ['False', DateTime.now().plus({ days: 1 }).toString(), false],
    ['True', DateTime.now().minus({ days: 1 }).toString(), true],
  ])('%s isInThePast(%s, %s)', (_: string, a: string, expected: boolean) => {
    expect(isInThePast(a)).toEqual(expected)
  })
})
