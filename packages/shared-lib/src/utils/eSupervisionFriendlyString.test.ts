import { getUserFriendlyString } from './eSupervisionFriendlyString'

describe('utils/getUserFriendlyString', () => {
  it('returns empty string for null', () => {
    expect(getUserFriendlyString(null)).toBe('')
  })
  it('returns string without changes if no definition matched', () => {
    expect(getUserFriendlyString('This is a string')).toBe('This is a string')
  })
  it('returns friendly string if uppercase input matches definition', () => {
    expect(getUserFriendlyString('two_weeks')).toBe('Every 2 weeks')
  })
})
