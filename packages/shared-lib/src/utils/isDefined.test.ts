import { isDefined } from './isDefined'

describe('utils/isDefined', () => {
  it('should return true if value is defined', () => {
    expect(isDefined('value')).toEqual(true)
    expect(isDefined(null)).toEqual(true)
    expect(isDefined('')).toEqual(true)
  })
  it('should return false if value is undefined', () => {
    expect(isDefined(undefined)).toEqual(false)
  })
})
