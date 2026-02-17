import { hasValue } from './hasValue'

describe('utils/hasValue', () => {
  it('should return true if value is defined and is not null', () => {
    expect(hasValue('value')).toEqual(true)
    expect(hasValue('')).toEqual(true)
  })
  it('should return false if value is not defined', () => {
    expect(hasValue(undefined)).toEqual(false)
  })
  it('should return false if value is null', () => {
    expect(hasValue(null)).toEqual(false)
  })
})
