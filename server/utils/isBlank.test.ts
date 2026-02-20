import { isBlank } from '.'

jest.mock('@ministryofjustice/manage-people-on-probation-shared-lib')

describe('utils/isBlank', () => {
  it('should return true if string is empty', () => {
    expect(isBlank('')).toEqual(true)
  })
  it('should return false if string is not empty', () => {
    expect(isBlank('string')).toEqual(false)
  })
})
