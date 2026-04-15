import { standardiseTimeValue } from './standardiseTimeValue'

describe('utils/standardiseTimeValue', () => {
  it('should not change date in valid format', () => {
    const input = '01:30'
    const result = standardiseTimeValue(input)
    expect(result).toStrictEqual('01:30')
  })
  it('should not change date in valid format', () => {
    const input = '15:05'
    const result = standardiseTimeValue(input)
    expect(result).toStrictEqual('15:05')
  })
  it('should add missing leading 0s to hour', () => {
    const input = '1:30'
    const result = standardiseTimeValue(input)
    expect(result).toStrictEqual('01:30')
  })
  it('should not add missing leading 0s to minute', () => {
    const input = '07:3'
    const result = standardiseTimeValue(input)
    expect(result).toStrictEqual('07:3')
  })
  it('should remove am treating as 24h', () => {
    const input = '01:30am'
    const result = standardiseTimeValue(input)
    expect(result).toStrictEqual('01:30')
  })
  it('should remove pm treating as 24h', () => {
    const input = '01:30pm'
    const result = standardiseTimeValue(input)
    expect(result).toStrictEqual('13:30')
  })
  describe('should change alternate separators to :', () => {
    it('should change / to :', () => {
      const input = '01/30'
      const result = standardiseTimeValue(input)
      expect(result).toStrictEqual('01:30')
    })
    it('should change . to :', () => {
      const input = '01.30'
      const result = standardiseTimeValue(input)
      expect(result).toStrictEqual('01:30')
    })
    it('should change space separator to :', () => {
      const input = '01 30'
      const result = standardiseTimeValue(input)
      expect(result).toStrictEqual('01:30')
    })
    it('should change _ to :', () => {
      const input = '01_30'
      const result = standardiseTimeValue(input)
      expect(result).toStrictEqual('01:30')
    })
    it('should change - to :', () => {
      const input = '01-30'
      const result = standardiseTimeValue(input)
      expect(result).toStrictEqual('01:30')
    })
  })
  it('should perform combined changes if needed', () => {
    const input = '1.30'
    const result = standardiseTimeValue(input)
    expect(result).toStrictEqual('01:30')
  })
  describe('should not change invalid formats', () => {
    it('no separators', () => {
      const input = '0530'
      const result = standardiseTimeValue(input)
      expect(result).toStrictEqual('0530')
    })
    it('invalid time', () => {
      const input = '27:30'
      const result = standardiseTimeValue(input)
      expect(result).toStrictEqual('27:30')
    })
    it('empty string', () => {
      const input = ''
      const result = standardiseTimeValue(input)
      expect(result).toStrictEqual('')
    })
    it('undefined input', () => {
      const result = standardiseTimeValue(undefined)
      expect(result).toStrictEqual(undefined)
    })
  })
})
