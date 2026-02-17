import { isNumericString } from './isNumericString'

describe('utils/isNumericString', () => {
  it('should return false if value is undefined', () => {
    expect(isNumericString(undefined)).toEqual(false)
  })
  it('should return false if value is null', () => {
    expect(isNumericString(null)).toEqual(false)
  })
  it('should return false if value is an empty string', () => {
    expect(isNumericString('')).toEqual(false)
  })
  it('should return false if string does not contain only numbers', () => {
    expect(isNumericString('123X45')).toEqual(false)
  })
  it('should return true if string only contains numbers', () => {
    expect(isNumericString('12345')).toEqual(true)
  })
})
