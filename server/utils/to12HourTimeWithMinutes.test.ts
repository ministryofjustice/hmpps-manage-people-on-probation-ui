import { DateTime } from 'luxon'
import { toIso12HourTimeWithMinutes } from './to12HourTimeWithMinutes'

describe('toIso12HourTimeWithMinutes', () => {
  const formatExpected = (iso: string) =>
    DateTime.fromISO(iso, { zone: 'utc' }).setZone('Europe/London').toFormat('h:mma').toLowerCase()

  it('formats midnight correctly', () => {
    expect(toIso12HourTimeWithMinutes('2026-04-29T00:00:00+01:00')).toBe(formatExpected('2026-04-28T23:00:00Z'))
  })

  it('formats morning time without leading zero on hour', () => {
    expect(toIso12HourTimeWithMinutes('2026-04-29T09:00:00+01:00')).toBe(formatExpected('2026-04-29T08:00:00Z'))
  })

  it('formats morning time with minutes', () => {
    expect(toIso12HourTimeWithMinutes('2026-04-29T09:15:00+01:00')).toBe(formatExpected('2026-04-29T08:15:00Z'))
  })

  it('formats noon correctly', () => {
    expect(toIso12HourTimeWithMinutes('2026-04-29T13:05:00+01:00')).toBe(formatExpected('2026-04-29T12:05:00Z'))
  })

  it('formats afternoon time', () => {
    expect(toIso12HourTimeWithMinutes('2026-04-29T16:05:00+01:00')).toBe(formatExpected('2026-04-29T15:05:00Z'))
  })

  it('pads minutes with leading zero when needed', () => {
    expect(toIso12HourTimeWithMinutes('2026-04-29T13:05:00+01:00')).toBe(formatExpected('2026-04-29T12:05:00Z'))
  })
  it('handles UTC timezone correctly', () => {
    expect(toIso12HourTimeWithMinutes('2026-04-29T12:00:00Z')).toBe(formatExpected('2026-04-29T12:00:00Z'))
  })
})
