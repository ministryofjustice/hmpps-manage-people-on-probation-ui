import { toIsoDateFromPicker } from './toIsoDateFromPicker'

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
})
