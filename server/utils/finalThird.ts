import { DateTime } from 'luxon'

export interface FinalThirdPrompt {
  eligible: boolean
}

/**
 * Whether a final third eligibility status should still be displayed: the day it became
 * effective plus the following 6 calendar days (7 calendar days total). Comparison is
 * date-only.
 */
export const isFinalThirdEligibilityInWindow = (since: string, now: DateTime = DateTime.now(), days = 7): boolean => {
  const sinceDay = DateTime.fromISO(since).startOf('day')
  if (!sinceDay.isValid) {
    return false
  }
  const diff = now.startOf('day').diff(sinceDay, 'days').days
  return diff >= 0 && diff <= days - 1
}
