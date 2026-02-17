export interface CaseAccess {
  crn: string
  userExcluded?: boolean
  userRestricted?: boolean
  exclusionMessage?: string
  restrictionMessage?: string
}

export interface UserAccess {
  access: CaseAccess[]
}

export interface RecentlyViewedCases {
  cases: RecentlyViewedCase[]
}

export interface RecentlyViewedCase {
  name?: string
  crn?: string
  dob?: string
  age?: string
  tierScore?: string
  sentence?: string
  numberOfAdditionalSentences?: string
  limitedAccess?: boolean
}
