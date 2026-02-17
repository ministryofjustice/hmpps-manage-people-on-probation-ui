import { getDurationInMinutes } from './getDurationInMinutes'

describe('getDurationInMinutes', () => {
  it.each([
    ['same timestamp -> 0', new Date('2025-10-17T12:00:00Z'), new Date('2025-10-17T12:00:00Z'), 0],
    ['fractional < 1 minute -> 0', new Date('2025-10-17T12:00:00Z'), new Date('2025-10-17T12:00:30Z'), 0],
    ['exact minutes rounding down -> 2', new Date('2025-10-17T12:00:00Z'), new Date('2025-10-17T12:02:30Z'), 2],
    ['start after end small fractional -> 0', new Date('2025-10-17T12:00:30Z'), new Date('2025-10-17T12:00:00Z'), 0],
    ['start after end whole minutes -> 0', new Date('2025-10-17T12:05:00Z'), new Date('2025-10-17T12:02:00Z'), 0],
    ['multi-day duration -> 2880', new Date('2025-01-01T00:00:00Z'), new Date('2025-01-03T00:00:00Z'), 2880],
  ])('%s', (_name, start: Date, end: Date, expected: number) => {
    expect(getDurationInMinutes(start, end)).toBe(expected)
  })
})
