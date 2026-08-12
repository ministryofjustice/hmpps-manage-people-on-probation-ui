import { toYesNo } from './toYesNo'

describe('boolean to yes or no', () => {
  it.each([
    ['null', false, null, 'Not provided'],
    ['null', true, null, 'No'],
    ['Yes', false, true, 'Yes'],
    ['No', false, false, 'No'],
  ])('%s toYesNo(%s, %s)', (_: string, nullIsNo: boolean, a: boolean, expected: string) => {
    expect(toYesNo(a, nullIsNo)).toEqual(expected)
  })
})
