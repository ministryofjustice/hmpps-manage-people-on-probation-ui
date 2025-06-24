import { properCase, properCaseName, convertToTitleCase } from '.'

describe('utils/properCase', () => {
  it('should return an empty string, if argument is an empty string', () => {
    expect(properCase('')).toEqual('')
  })
  it('should return a capitalised letter if word is 1 character in length', () => {
    expect(properCase('a')).toEqual('A')
  })
  it('should return a capitalised case word if word is more than 1 character in length', () => {
    expect(properCase('proper')).toEqual('Proper')
  })
})

describe('utils/properCaseName', () => {
  it('should return a blank string if name is blank', () => {
    expect('').toEqual('')
  })
  it('should return the same string if string does not contain a dash', () => {
    expect('smith').toEqual('smith')
  })
  it('should format a double barrel name correctly', () => {
    expect(properCaseName('harvey-smith')).toEqual('Harvey-Smith')
  })
})

describe('utils/convertToTitleCase', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
  it('should not convert ignored values', () => {
    const str = 'Initial appointment - in office (NS)'
    expect(convertToTitleCase(str, ['(NS)'])).toEqual('Initial Appointment - In Office (NS)')
  })
})
