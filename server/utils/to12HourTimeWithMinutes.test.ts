import { DateTime } from 'luxon'
import { to12HourTimeWithMinutes, toIso12HourTimeWithMinutes } from './to12HourTimeWithMinutes'

describe('to12HourTimeWithMinutes', () => {
  it('formats midnight correctly', () => {
    expect(to12HourTimeWithMinutes('00:00')).toBe('12:00am')
  })

  it('formats morning time without leading zero on hour', () => {
    expect(to12HourTimeWithMinutes('09:00')).toBe('9:00am')
  })

  it('formats morning time with minutes', () => {
    expect(to12HourTimeWithMinutes('09:15')).toBe('9:15am')
  })

  it('formats noon correctly', () => {
    expect(to12HourTimeWithMinutes('12:00')).toBe('12:00pm')
  })

  it('formats afternoon time', () => {
    expect(to12HourTimeWithMinutes('16:05')).toBe('4:05pm')
  })

  it('pads minutes with leading zero when needed', () => {
    expect(to12HourTimeWithMinutes('13:05')).toBe('1:05pm')
  })
})

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
