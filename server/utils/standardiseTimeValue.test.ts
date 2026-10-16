import { standardiseTimeValue } from './standardiseTimeValue'

describe('utils/standardiseTimeValue', () => {
  it.each([
    ['01:30', '01:30', 'should not change time in valid format'],
    ['15:05', '15:05', 'should not change time in valid format'],
    ['1:30', '01:30', 'should add missing leading 0s to hour'],
    ['07:3', '07:3', 'should not add missing leading 0s to minute'],
    ['01:30am', '01:30', 'should remove am treating as 24h'],
    ['01:30pm', '13:30', 'should remove pm treating as 24h'],
  ])('%s → %s: %s', (input, expected) => {
    expect(standardiseTimeValue(input)).toStrictEqual(expected)
  })
  describe('should change alternate separators to :', () => {
    it.each([
      ['01/30', '01:30'],
      ['01.30', '01:30'],
      ['01 30', '01:30'],
      ['01_30', '01:30'],
      ['01-30', '01:30'],
    ])('should standardise "%s" to "%s"', (input, expected) => {
      expect(standardiseTimeValue(input)).toStrictEqual(expected)
    })
  })
  it('should perform combined changes if needed', () => {
    const input = '1.30'
    const result = standardiseTimeValue(input)
    expect(result).toStrictEqual('01:30')
  })
  describe('should not change invalid formats', () => {
    it.each([
      ['0530', '0530', 'no separators'],
      ['27:30', '27:30', 'invalid time'],
      ['', '', 'empty string'],
    ])('%s - %s (%s)', (input, expected) => {
      expect(standardiseTimeValue(input)).toStrictEqual(expected)
    })
    it('undefined input', () => {
      const result = standardiseTimeValue(undefined)
      expect(result).toBeUndefined()
    })
  })
})
