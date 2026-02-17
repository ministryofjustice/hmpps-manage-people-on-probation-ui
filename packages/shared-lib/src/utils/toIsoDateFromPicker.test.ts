import { toIsoDateFromPicker, toIsoDateTimeFromPicker } from './toIsoDateFromPicker'

describe('utils/toIsoDateFromPicker', () => {
  it.each([
    ['null', undefined, null],
    ['null', null, null],
    ['null', '', null],
  ])('it should return %s', (_: string, a: string, expected: null) => {
    expect(toIsoDateFromPicker(a)).toEqual(expected)
  })

  it('should return the unformatted date if invalid', () => {
    expect(toIsoDateFromPicker('31/2/2025')).toEqual('31/2/2025')
  })
  it('should return a formatted date', () => {
    expect(toIsoDateFromPicker('1/2/2025')).toEqual('2025-02-01')
  })
  it('should return a formatted date time at start of day', () => {
    expect(toIsoDateTimeFromPicker('2/4/2025')).toEqual('2025-04-02T00:00:00.000Z')
  })
  it('should return null when invalid date is supplied', () => {
    expect(toIsoDateTimeFromPicker('blah')).toEqual(null)
  })
})
