import { convertToLowerCase } from './convertToLowerCase'

describe('utils/convertToLowerCase', () => {
  const str = 'The breach for ORA Community Order (3 years) was initiated on 1 June 2026.'
  it('should return an empty string if no string', () => {
    expect(convertToLowerCase(undefined)).toEqual('')
  })
  it('should return the string converted to lowercase if no arguments passed', () => {
    expect(convertToLowerCase(str)).toEqual(
      'the breach for ORA community order (3 years) was initiated on 1 june 2026.',
    )
  })
  it('should convert the string if arguments has preserved words', () => {
    expect(convertToLowerCase(str, { preserveWords: ['Community', 'Order', 'June'] })).toEqual(
      'the breach for ORA Community Order (3 years) was initiated on 1 June 2026.',
    )
  })
  it('should convert the string if not preserve capitalised words', () => {
    expect(convertToLowerCase(str, { preserveCapWords: false, preserveWords: ['June'] })).toEqual(
      'the breach for ora community order (3 years) was initiated on 1 June 2026.',
    )
  })
})
