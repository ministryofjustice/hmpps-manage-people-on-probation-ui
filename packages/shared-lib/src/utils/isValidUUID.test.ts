import { isValidUUID } from './isValidUUID'

describe('utils/isValidUUID', () => {
  it('should return false if the string isnt a valid UUID format', () => {
    expect(isValidUUID('19a88188-6013-43a7--bb4d-6e338516818f')).toEqual(false)
    expect(isValidUUID('19a88188-6013-43a7-bb4d-6e33851681')).toEqual(false)
  })
  it('should return true if the string is a valid UUID format', () => {
    expect(isValidUUID('19a88188-6013-43a7-bb4d-6e338516818f')).toEqual(true)
  })
})
