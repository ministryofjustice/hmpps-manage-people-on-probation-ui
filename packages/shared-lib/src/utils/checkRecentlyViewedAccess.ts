import { RecentlyViewedCase, UserAccess } from '../data/model/caseAccess'

export const checkRecentlyViewedAccess = (
  recentlyViewed: RecentlyViewedCase[],
  userAccess: UserAccess,
): RecentlyViewedCase[] => {
  return recentlyViewed.map(rv => {
    const ua = userAccess?.access?.find(u => u.crn === rv.crn)
    return { ...rv, limitedAccess: ua?.userExcluded === true || ua?.userRestricted === true }
  })
}
