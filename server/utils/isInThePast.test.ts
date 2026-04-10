import { DateTime } from 'luxon'
import { isInThePast } from './isInThePast'

describe('utils/isInThePast', () => {
  it.each([
    ['Null', null, null],
    ['False', DateTime.now().setZone('Europe/London').plus({ days: 1 }).toString(), false],
    ['True', DateTime.now().setZone('Europe/London').minus({ days: 1 }).toString(), true],
  ])('%s isInThePast(%s, %s)', (_: string, a: string, expected: boolean) => {
    expect(isInThePast(a)).toEqual(expected)
  })
})
