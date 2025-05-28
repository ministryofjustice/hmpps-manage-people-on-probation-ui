import { isValidCrn } from './isValidCrn'

describe('utils/isValidCrn', () => {
  it('should return false if a string is not the correct CRN format', () => {
    expect(isValidCrn('XX1234')).toEqual(false)
    expect(isValidCrn('x123456')).toEqual(false)
  })
  it('should return true if a string is the correct CRN format', () => {
    expect(isValidCrn('X000001')).toEqual(true)
  })
})
