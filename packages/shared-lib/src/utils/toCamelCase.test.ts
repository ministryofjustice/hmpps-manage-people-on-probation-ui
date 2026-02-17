import { toCamelCase } from './toCamelCase'

describe('utils/toCamelCase', () => {
  it('should format a sentence in camel case', () => {
    expect(toCamelCase('convert this sentence to camel case')).toEqual('convertThisSentenceToCamelCase')
  })
  it('should convert a word to camel case', () => {
    expect(toCamelCase('camel')).toEqual('camel')
  })
  it('should convert a snake case string to camel case', () => {
    expect(toCamelCase('camel-case')).toEqual('camelCase')
  })
})
