import { standardiseDateValue } from './standardiseDateValue'

describe('utils/standardiseDateValue', () => {
  it('should not change date in valid format', () => {
    const input = '1/1/2020'
    const result = standardiseDateValue(input)
    expect(result).toStrictEqual('1/1/2020')
  })
  it('should not change date in valid format', () => {
    const input = '17/10/2020'
    const result = standardiseDateValue(input)
    expect(result).toStrictEqual('17/10/2020')
  })
  it('should remove leading 0s', () => {
    const input = '01/01/2020'
    const result = standardiseDateValue(input)
    expect(result).toStrictEqual('1/1/2020')
  })
  it('should remove leading 0s', () => {
    const input = '01/10/2020'
    const result = standardiseDateValue(input)
    expect(result).toStrictEqual('1/10/2020')
  })
  it('should remove leading 0s', () => {
    const input = '17/01/2020'
    const result = standardiseDateValue(input)
    expect(result).toStrictEqual('17/1/2020')
  })
  it('should change short year to full year', () => {
    const input = '01/01/20'
    const result = standardiseDateValue(input)
    expect(result).toStrictEqual('1/1/2020')
  })
  describe('should change alternate separators to /', () => {
    it('should change - to /', () => {
      const input = '1-1-2020'
      const result = standardiseDateValue(input)
      expect(result).toStrictEqual('1/1/2020')
    })
    it('should change . to /', () => {
      const input = '1.1.2020'
      const result = standardiseDateValue(input)
      expect(result).toStrictEqual('1/1/2020')
    })
    it('should change space separator to /', () => {
      const input = '1 1 2020'
      const result = standardiseDateValue(input)
      expect(result).toStrictEqual('1/1/2020')
    })
    it('should change _ to /', () => {
      const input = '1_1_2020'
      const result = standardiseDateValue(input)
      expect(result).toStrictEqual('1/1/2020')
    })
  })
  it('should perform combined changes if needed', () => {
    const input = '01_01_20'
    const result = standardiseDateValue(input)
    expect(result).toStrictEqual('1/1/2020')
  })
  describe('should not change invalid formats', () => {
    it('mixed separators', () => {
      const input = '01_01/20'
      const result = standardiseDateValue(input)
      expect(result).toStrictEqual('01_01/20')
    })
    it('no separators', () => {
      const input = '010120'
      const result = standardiseDateValue(input)
      expect(result).toStrictEqual('010120')
    })
    it('invalid date', () => {
      const input = '13/13/2020'
      const result = standardiseDateValue(input)
      expect(result).toStrictEqual('13/13/2020')
    })
    it('empty string', () => {
      const input = ''
      const result = standardiseDateValue(input)
      expect(result).toStrictEqual('')
    })
    it('undefined input', () => {
      const result = standardiseDateValue(undefined)
      expect(result).toStrictEqual(undefined)
    })
  })
})
