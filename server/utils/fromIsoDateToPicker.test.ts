import { fromIsoDateToPicker } from './fromIsoDateToPicker'

describe('utils/fromIsoDateToPicker', () => {
  it.each([
    ['null', undefined, null],
    ['null', null, null],
    ['null', '', null],
  ])('it should return %s', (_: string, a: string, expected: null) => {
    expect(fromIsoDateToPicker(a)).toEqual(expected)
  })
  it('should return the unformatted date if invalid', () => {
    expect(fromIsoDateToPicker('2025-02-31')).toEqual('2025-02-31')
  })
  it('should return a formatted date', () => {
    expect(fromIsoDateToPicker('2025-02-01')).toEqual('1/2/2025')
  })
})
