import { isNotNull } from './isNotNull'

describe('utils/isNotNull', () => {
  it('should return true if value is not null', () => {
    expect(isNotNull('value')).toEqual(true)
    expect(isNotNull('')).toEqual(true)
    expect(isNotNull(undefined)).toEqual(true)
  })
  it('should return false if value is null', () => {
    expect(isNotNull(null)).toEqual(false)
  })
})
