import { DateTime, Settings } from 'luxon'
import { getDateRange } from './getDateRange'

const mockNow = (iso: string) => {
  const dt = DateTime.fromISO(iso, { zone: 'utc' })

  if (!dt.isValid) {
    throw new Error('Invalid ISO date in test')
  }

  Settings.now = () => dt.toMillis()
}

describe('getDateRange', () => {
  afterEach(() => {
    Settings.now = () => Date.now()
  })

  describe('PAST_TWO_YEARS', () => {
    it('returns correct range in UK timezone', () => {
      mockNow('2026-04-27T10:00:00Z')

      const result = getDateRange('PAST_TWO_YEARS')

      expect(result).toEqual({
        fromDate: '2024-04-27',
        toDate: '2026-04-27',
      })
    })

    it('is inclusive of today', () => {
      mockNow('2026-01-01T00:00:00Z')

      const result = getDateRange('PAST_TWO_YEARS')

      expect(result.toDate).toBe('2026-01-01')
    })
  })

  describe('OLDER_THAN_TWO_YEARS', () => {
    it('returns correct upper bound (no overlap)', () => {
      mockNow('2026-04-27T10:00:00Z')

      const result = getDateRange('OLDER_THAN_TWO_YEARS')

      expect(result).toEqual({
        toDate: '2024-04-26',
      })
    })
  })

  describe('ALL', () => {
    it('returns no filters (unbounded range)', () => {
      mockNow('2026-04-27T10:00:00Z')

      const result = getDateRange('ALL')

      expect(result).toEqual({})
    })
  })

  describe('timezone + DST behaviour', () => {
    it('handles BST (summer time, UTC+1)', () => {
      mockNow('2026-06-15T23:30:00Z')

      const result = getDateRange('ALL')

      expect(result).toEqual({})
    })

    it('handles GMT (winter time)', () => {
      mockNow('2026-01-15T23:30:00Z')

      const result = getDateRange('ALL')

      expect(result).toEqual({})
    })

    it('throws error for unsupported range type', () => {
      mockNow('2026-04-27T10:00:00Z')

      expect(() => getDateRange('INVALID_TYPE' as any)).toThrow('Unhandled range type: INVALID_TYPE')
    })
  })
})
