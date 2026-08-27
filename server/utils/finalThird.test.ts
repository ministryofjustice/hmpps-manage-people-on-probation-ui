import { DateTime } from 'luxon'
import { isFinalThirdEligibilityInWindow } from './finalThird'

describe('utils/finalThird', () => {
  describe('isFinalThirdEligibilityInWindow', () => {
    const now = DateTime.fromISO('2026-07-29T09:00:00')

    it('shows a status that became effective today (diff 0)', () => {
      expect(isFinalThirdEligibilityInWindow('2026-07-29T23:00:00', now)).toBe(true)
    })

    it('shows a status on the 6th day after (diff 6, boundary)', () => {
      expect(isFinalThirdEligibilityInWindow('2026-07-23T01:00:00', now)).toBe(true)
    })

    it('hides a status on the 7th day after (diff 7, just outside)', () => {
      expect(isFinalThirdEligibilityInWindow('2026-07-22T23:00:00', now)).toBe(false)
    })

    it('hides a future status (negative diff)', () => {
      expect(isFinalThirdEligibilityInWindow('2026-07-30T00:00:00', now)).toBe(false)
    })

    it('hides an invalid date', () => {
      expect(isFinalThirdEligibilityInWindow('not-a-date', now)).toBe(false)
    })
  })
})
