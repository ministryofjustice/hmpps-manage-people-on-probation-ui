import { toYesNo } from './toYesNo'

describe('boolean to yes or no', () => {
  it.each([
    ['Not provided', null, 'Not provided'],
    ['Yes', true, 'Yes'],
    ['No', false, 'No'],
  ])('%s toYesNo(%s, %s)', (_: string, a: boolean, expected: string) => {
    expect(toYesNo(a)).toEqual(expected)
  })
})
