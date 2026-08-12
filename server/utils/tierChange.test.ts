import { DateTime } from 'luxon'
import { getMostRecentTierChange, isTierChangeInWindow } from './tierChange'
import { TierHistoryEntry } from '../data/tierApiClient'

const entry = (tierScore: string, calculationDate: string): TierHistoryEntry => ({
  tierScore,
  calculationId: `calc-${calculationDate}`,
  calculationDate,
  changeReason: 'The supervision status changed',
  provisional: false,
})

describe('utils/tierChange', () => {
  describe('getMostRecentTierChange', () => {
    it('returns null for empty, nullish or single-record histories', () => {
      expect(getMostRecentTierChange([])).toBeNull()
      expect(getMostRecentTierChange(null)).toBeNull()
      expect(getMostRecentTierChange(undefined)).toBeNull()
      expect(getMostRecentTierChange([entry('A2', '2026-07-29T10:00:00')])).toBeNull()
    })

    it('returns null when every record has the same tier (no change)', () => {
      const history = [
        entry('A2', '2026-07-29T10:00:00'),
        entry('A2', '2026-07-20T10:00:00'),
        entry('A2', '2026-07-10T10:00:00'),
      ]
      expect(getMostRecentTierChange(history)).toBeNull()
    })

    it('detects the most recent change, ignoring consecutive recalculations of the same tier', () => {
      const history = [
        entry('A1', '2026-07-29T10:00:00'),
        entry('A1', '2026-07-28T10:00:00'),
        entry('A2', '2026-07-20T10:00:00'),
        entry('A2', '2026-07-10T10:00:00'),
      ]
      expect(getMostRecentTierChange(history)).toEqual({
        oldTier: 'A2',
        newTier: 'A1',
        changeDate: '2026-07-28T10:00:00',
      })
    })

    it('treats MISSING as a normal tier value (A2 to MISSING)', () => {
      const history = [
        entry('MISSING', '2026-07-29T10:00:00'),
        entry('MISSING', '2026-07-28T10:00:00'),
        entry('A2', '2026-07-20T10:00:00'),
      ]
      expect(getMostRecentTierChange(history)).toEqual({
        oldTier: 'A2',
        newTier: 'MISSING',
        changeDate: '2026-07-28T10:00:00',
      })
    })

    it('treats MISSING as a normal tier value (MISSING to A2)', () => {
      const history = [entry('A2', '2026-07-29T10:00:00'), entry('MISSING', '2026-07-20T10:00:00')]
      expect(getMostRecentTierChange(history)).toEqual({
        oldTier: 'MISSING',
        newTier: 'A2',
        changeDate: '2026-07-29T10:00:00',
      })
    })

    it('sorts defensively when the history is not newest-first', () => {
      const history = [
        entry('A2', '2026-07-10T10:00:00'),
        entry('A1', '2026-07-29T10:00:00'),
        entry('A2', '2026-07-20T10:00:00'),
      ]
      expect(getMostRecentTierChange(history)).toEqual({
        oldTier: 'A2',
        newTier: 'A1',
        changeDate: '2026-07-29T10:00:00',
      })
    })
  })

  describe('isTierChangeInWindow', () => {
    const now = DateTime.fromISO('2026-07-29T09:00:00')

    it('shows a change that happened today (diff 0)', () => {
      expect(isTierChangeInWindow('2026-07-29T23:00:00', now)).toBe(true)
    })

    it('shows a change on the 6th day after (diff 6, boundary)', () => {
      expect(isTierChangeInWindow('2026-07-23T01:00:00', now)).toBe(true)
    })

    it('hides a change on the 7th day after (diff 7, just outside)', () => {
      expect(isTierChangeInWindow('2026-07-22T23:00:00', now)).toBe(false)
    })

    it('hides a future change (negative diff)', () => {
      expect(isTierChangeInWindow('2026-07-30T00:00:00', now)).toBe(false)
    })

    it('hides an invalid date', () => {
      expect(isTierChangeInWindow('not-a-date', now)).toBe(false)
    })

    it('honours a custom window: shows a change today when days is 1', () => {
      expect(isTierChangeInWindow('2026-07-29T08:00:00', now, 1)).toBe(true)
    })

    it('honours a custom window: hides a change from the previous day when days is 1', () => {
      expect(isTierChangeInWindow('2026-07-28T23:00:00', now, 1)).toBe(false)
    })

    it('honours a custom window: shows a change on the boundary day when days is 3', () => {
      expect(isTierChangeInWindow('2026-07-27T01:00:00', now, 3)).toBe(true)
      expect(isTierChangeInWindow('2026-07-26T23:00:00', now, 3)).toBe(false)
    })
  })

  it('does not prompt for the provided sample (change on 2026-06-10, well outside the window)', () => {
    const sample = [
      entry('MISSING', '2026-07-29T13:15:59.090055'),
      entry('MISSING', '2026-06-10T17:50:52.260175'),
      entry('A2', '2026-06-10T10:37:34.581823'),
      entry('A2', '2026-06-08T09:38:27.920390'),
    ]
    const change = getMostRecentTierChange(sample)
    expect(change).toEqual({
      oldTier: 'A2',
      newTier: 'MISSING',
      changeDate: '2026-06-10T17:50:52.260175',
    })
    expect(isTierChangeInWindow(change!.changeDate, DateTime.fromISO('2026-07-29T09:00:00'))).toBe(false)
  })
})
