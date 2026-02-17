import { RecentlyViewedCase, UserAccess } from '../data/model/caseAccess'
import { checkRecentlyViewedAccess } from './checkRecentlyViewedAccess'

describe('utils/checkRecentlyViewedAccess', () => {
  it.each([
    [
      'sets limited access to true for exclusion',
      [{ crn: 'X123456' }],
      { access: [{ crn: 'X123456', userExcluded: true }] },
      true,
    ],
    [
      'sets limited access to true for restriction',
      [{ crn: 'X123456' }],
      { access: [{ crn: 'X123456', userRestricted: true }] },
      true,
    ],
    [
      'sets limited access to false for false restriction',
      [{ crn: 'X123456' }],
      { access: [{ crn: 'X123456', userRestricted: false }] },
      false,
    ],
    [
      'sets limited access to false for false exclusion',
      [{ crn: 'X123456' }],
      { access: [{ crn: 'X123456', userExcluded: false }] },
      false,
    ],
    [
      'sets limited access to false for no restriction or exclusion',
      [{ crn: 'X123456' }],
      { access: [{ crn: 'X123456' }] },
      false,
    ],
  ])('%s checkRecentlyViewedAccess(%s, %s)', (_: string, a: RecentlyViewedCase[], b: UserAccess, expected: boolean) => {
    const result = checkRecentlyViewedAccess(a, b)
    expect(result[0].limitedAccess).toEqual(expected)
  })
})
