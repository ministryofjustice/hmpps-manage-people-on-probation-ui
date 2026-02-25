import { toSentenceCase } from './toSentenceCase'

jest.mock('@ministryofjustice/manage-people-on-probation-shared-lib')

describe('toSentenceCase()', () => {
  it('should expect one argument', () => {
    expect(toSentenceCase.length).toEqual(1)
  })
  it('should return an empty string if argument is undefined, null or an empty string', () => {
    expect(toSentenceCase(null)).toEqual('')
    expect(toSentenceCase(undefined)).toEqual('')
    expect(toSentenceCase('')).toEqual('')
  })
  it('should return the correctly formatted string if argument is a capitalised snake case value', () => {
    expect(toSentenceCase('SNAKE_CASE_VALUE')).toEqual('SNAKE CASE VALUE')
  })
  it('should return the correctly formatted string if argument is a train case value', () => {
    expect(toSentenceCase('train-case-value', [], [])).toEqual('Train case value')
  })
  it('should return the correctly formatted string if argument is a capitalised value', () => {
    expect(toSentenceCase('A CAPITALISED VALUE')).toEqual('A CAPITALISED VALUE')
  })
  it('should return the correctly formatted string if argument is a camel cased value', () => {
    expect(toSentenceCase('Camel Cased Value')).toEqual('Camel cased value')
  })
  it('should not convert preserved values', () => {
    const str = 'Initial Appointment - Planned Office Visit (NS)'
    expect(toSentenceCase(str)).toEqual('Initial appointment - planned office visit (NS)')
    const strNonNS = 'Initial Appointment - In office (Non NS)'
    expect(toSentenceCase(strNonNS)).toEqual('Initial appointment - in office (Non NS)')
  })
  it('should not remove hyphens from the string if they are preserved', () => {
    const str = 'A-Title-Cased-Value'
    expect(toSentenceCase(str)).toEqual('A-title-cased-value')
  })
  it('should not remove underscores from the string if they are preserved', () => {
    const str = 'A_Title_Cased_Value'
    expect(toSentenceCase(str, [], ['_'])).toEqual('A_title_cased_value')
  })
  it('should should not convert preserved word but remove hyphens', () => {
    const str = 'A-Title-Cased-Value'
    expect(toSentenceCase(str, ['Title'], [])).toEqual('A Title cased value')
  })
  it('should should not convert preserved words but remove underscores', () => {
    const str = 'A_Title_Cased_Value'
    expect(toSentenceCase(str, ['Title', 'Value'])).toEqual('A Title cased Value')
  })
  it('should convert capitalised words if ignoreCapWords param is false', () => {
    const str = 'This is the CAPITAL city'
    expect(toSentenceCase(str, [], [], true, false)).toEqual('This is the capital city')
  })
})
