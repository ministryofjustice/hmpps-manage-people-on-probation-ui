import { escapeQuotes } from './escapeQuotes'

describe('escapeQuotes()', () => {
  it('should return the string if not defined', () => {
    expect(escapeQuotes('')).toEqual('')
    expect(escapeQuotes(undefined)).toBeUndefined()
    expect(escapeQuotes(null)).toBeNull()
  })
  it('should not format a string that contains no quotes', () => {
    const str = 'a string with no quotes'
    expect(escapeQuotes(str)).toEqual(str)
  })
  it('should escape quotes if contained in a string', () => {
    const str = 'a string containing "quotes" which needs to be "escaped"'
    const expectedStr = 'a string containing \\"quotes\\" which needs to be \\"escaped\\"'
    expect(escapeQuotes(str)).toEqual(expectedStr)
  })
})
