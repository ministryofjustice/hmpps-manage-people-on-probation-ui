import { toSentenceDescription } from './toSentenceDescription'

describe('utils/toSentenceDescription', () => {
  const expected = 'Pre-Sentence'
  it('should return the value if it is defined', () => {
    const value = 'Default Sentence Type'
    expect(toSentenceDescription(value)).toEqual(value)
  })
  it(`should return '${expected}' if value is not defined`, () => {
    expect(toSentenceDescription(undefined)).toEqual(expected)
    expect(toSentenceDescription(null)).toEqual(expected)
    expect(toSentenceDescription('')).toEqual(expected)
  })
})
