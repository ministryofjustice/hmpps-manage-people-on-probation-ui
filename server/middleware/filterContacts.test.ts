import { DateTime } from 'luxon'
import { Contact } from '../data/model/overdueOutcomes'
import { filterContacts } from './filterContacts'


describe('filterContacts', () => {
  const outcomes: Contact[] = [
    { id: 1, date: '2025-01-01', start: '10:00', type: { code: 'A', description: 'A' } },
    { id: 2, date: '2023-04-30', start: '10:00', type: { code: 'B', description: 'B' } },
    { id: 3, date: '2023-04-28', start: '10:00', type: { code: 'C', description: 'C' } },
  ]

  beforeAll(() => {
    // Freeze time to 2025-04-29
    jest.useFakeTimers().setSystemTime(new Date('2025-04-29T00:00:00Z'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('filters contacts within last 2 years (default)', () => {
    const result = filterContacts(outcomes)

    expect(result).toEqual([
      outcomes[0], // 2025-01-01
      outcomes[1], // 2023-04-30 (just inside 2 years)
    ])
  })

  it('excludes contacts older than 2 years', () => {
    const result = filterContacts(outcomes)

    expect(result.find(c => c.id === 3)).toBeUndefined()
  })

  it('respects custom year range', () => {
    const result = filterContacts(outcomes, 1)

    expect(result).toEqual([
      outcomes[0], // only within last 1 year
    ])
  })

  it('returns empty array if no matches', () => {
    const result = filterContacts(outcomes, 0)

    expect(result).toEqual([])
  })

  it('handles empty input', () => {
    const result = filterContacts([])

    expect(result).toEqual([])
  })

  it('handles undefined input safely', () => {
    const result = filterContacts(undefined as any)

    expect(result).toBeUndefined()
  })
})