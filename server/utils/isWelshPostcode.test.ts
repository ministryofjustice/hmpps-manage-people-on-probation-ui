import { isWelshPostcode } from './isWelshPostcode'

describe('utils/isWelshPostcode', () => {
  it('should return false if postcode is not defined', () => {
    ;[undefined, null, ''].forEach(value => {
      expect(isWelshPostcode(value)).toEqual(false)
    })
  })
  it('should return false if postcode is less than 2 chars', () => {
    expect(isWelshPostcode('A')).toEqual(false)
  })
  it.each(['LS14 3TT', 'SW2 4PP'])('should return false for non welsh postcode %s', (a: string) => {
    expect(isWelshPostcode(a)).toEqual(false)
  })
  it.each(['CF2 4PP', 'SY2 7TT'])('should return true for welsh postcode %s', (a: string) => {
    expect(isWelshPostcode(a)).toEqual(true)
  })
})
