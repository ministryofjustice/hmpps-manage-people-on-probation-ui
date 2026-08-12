import { DateTime } from 'luxon'
import { TierHistoryEntry } from '../data/tierApiClient'

export interface TierChange {
  oldTier: string
  newTier: string
  changeDate: string
}

export interface TierChangePrompt {
  oldTier: string
  newTier: string
  historyHref: string
}

/**
 * Identify the most recent tier change from a tier history.
 *
 * The history is expected newest-first (the Tier API returns it in descending
 * calculationDate order); it is sorted defensively here regardless. A "tier change" is a
 * record whose tierScore differs from the next-older record's tierScore. Consecutive
 * records with the same score are recalculations, not changes, and are ignored.
 *
 * Returns the old/new tier and the date the current tier first appeared, or null when
 * there is no detectable change (empty history, a single record, or an unchanged tier).
 */
export const getMostRecentTierChange = (history: TierHistoryEntry[] | null | undefined): TierChange | null => {
  if (!Array.isArray(history) || history.length < 2) {
    return null
  }

  const sorted = [...history].sort(
    (a, b) => DateTime.fromISO(b.calculationDate).toMillis() - DateTime.fromISO(a.calculationDate).toMillis(),
  )

  const currentTier = sorted[0].tierScore

  // Walk down the contiguous run of the current tier to find its oldest occurrence -
  // that is the moment the tier first changed to its current value.
  let changeIndex = 0
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].tierScore === currentTier) {
      changeIndex = i
    } else {
      break
    }
  }

  // The entire history is the same tier - no change ever occurred.
  if (changeIndex + 1 >= sorted.length) {
    return null
  }

  return {
    oldTier: sorted[changeIndex + 1].tierScore,
    newTier: currentTier,
    changeDate: sorted[changeIndex].calculationDate,
  }
}

/**
 * Whether a tier change should still be displayed: the day the change occurred plus the
 * following `days - 1` calendar days (`days` calendar days total, defaulting to 7).
 * Comparison is date-only.
 */
export const isTierChangeInWindow = (changeDate: string, now: DateTime = DateTime.now(), days = 7): boolean => {
  const changeDay = DateTime.fromISO(changeDate).startOf('day')
  if (!changeDay.isValid) {
    return false
  }
  const diff = now.startOf('day').diff(changeDay, 'days').days
  return diff >= 0 && diff <= days - 1
}
