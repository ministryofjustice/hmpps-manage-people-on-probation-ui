import { isEmptyObject } from './isEmptyObject'

describe('utils/isEmptyObject', () => {
  it('should return false if object has a field defined', () => {
    expect(isEmptyObject({ f1: null, f2: undefined, f3: 'value' })).toEqual(false)
  })
  it('should return true if object has no defined fields', () => {
    expect(isEmptyObject({ f1: null, f2: undefined, f3: undefined, f4: null })).toEqual(true)
  })
  it('should return false if object has nested object with no defined fields', () => {
    expect(isEmptyObject({ f1: null, f2: undefined, f3: undefined, f4: { f5: null } })).toEqual(false)
  })
})
