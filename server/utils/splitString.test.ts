import { splitString } from './splitString'

describe('utils/splitString', () => {
  it('should split input by , by default', () => {
    const input = 'This, is, a, string'
    const result = splitString(input)
    expect(result).toStrictEqual(['This', 'is', 'a', 'string'])
    expect(result).toHaveLength(4)
  })
  it('should split input by seperator when given', () => {
    const input = 'This+ is+ a+ string'
    const result = splitString(input, '+')
    expect(result).toStrictEqual(['This', 'is', 'a', 'string'])
    expect(result).toHaveLength(4)
  })
})
