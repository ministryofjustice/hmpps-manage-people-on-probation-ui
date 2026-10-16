import { standardiseDateValue } from './standardiseDateValue'

describe('utils/standardiseDateValue', () => {
  it.each([
    ['1/1/2020', '1/1/2020'],
    ['17/10/2020', '17/10/2020'],
    ['01/01/2020', '1/1/2020'],
    ['01/10/2020', '1/10/2020'],
    ['17/01/2020', '17/1/2020'],
    ['01/01/20', '1/1/2020'],
  ])('standardiseDateValue(%s) returns %s', (input, expected) => {
    expect(standardiseDateValue(input)).toStrictEqual(expected)
  })
  describe('should change alternate separators to /', () => {
    it.each([
      ['-', '1-1-2020'],
      ['.', '1.1.2020'],
      [' ', '1 1 2020'],
      ['_', '1_1_2020'],
    ])('should change %s to /', (_, input) => {
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
    it.each([
      ['mixed separators', '01_01/20', '01_01/20'],
      ['no separators', '010120', '010120'],
      ['invalid date', '13/13/2020', '13/13/2020'],
      ['empty string', '', ''],
    ])('%s', (_description, input, expected) => {
      const result = standardiseDateValue(input)
      expect(result).toStrictEqual(expected)
    })
    it('undefined input', () => {
      const result = standardiseDateValue(undefined)
      expect(result).toBeUndefined()
    })
  })
})
