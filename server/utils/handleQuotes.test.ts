import { handleQuotes } from './handleQuotes'

describe('handleQuotes()', () => {
  it('should return the string if not defined', () => {
    expect(handleQuotes('')).toEqual('')
    expect(handleQuotes(undefined)).toBeUndefined()
    expect(handleQuotes(null)).toBeNull()
  })
  it('should not reformat a string that contains no quotes', () => {
    const str = 'a string with no quotes'
    expect(handleQuotes(str)).toEqual(str)
  })
  it('should escape quotes if contained in a string', () => {
    const str = 'a string containing "quotes" which needs to be "escaped"'
    const expectedStr = 'a string containing \\"quotes\\" which needs to be \\"escaped\\"'
    expect(handleQuotes(str)).toEqual(expectedStr)
  })
  it('should unescape a string', () => {
    const str = 'a string containing \\"quotes\\" that was \\"escaped\\"'
    const expectedStr = 'a string containing "quotes" that was "escaped"'
    expect(handleQuotes(str, 'unescape')).toEqual(expectedStr)
  })
})
