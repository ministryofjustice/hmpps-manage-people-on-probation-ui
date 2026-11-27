import { getMappedOutcome } from './getMappedOutcome'
import { outcomeMap } from '../properties/appointment-outcomes'

// Descriptions from prod Delius R_CONTACT_OUTCOME_TYPE
const deliusDescriptions: Record<string, string> = {
  AACL: 'Acceptable Absence - Court/Legal',
  AAEM: 'Acceptable Absence - Employment',
  AAFC: 'Acceptable Absence - Family/ Childcare',
  AAHO: 'Acceptable Absence - Holiday',
  AAME: 'Acceptable Absence - Medical',
  AARC: 'Acceptable Absence - RIC',
  AARE: 'Acceptable Absence - Religious',
  AFTA: 'Failed to Attend',
  AFTC: 'Attended - Failed to Comply',
  ATSH: 'Attended - Sent Home (behaviour)',
  ATSS: 'Attended - Sent Home (service issues)',
  ATTC: 'Attended - Complied',
  CO05: 'Acceptable Absence-Professional Judgement Decision',
  CO10: 'Acceptable Failure - None in following 12 months',
  UAAB: 'Unacceptable Absence',
}

describe('getMappedOutcome with the real outcomeMap', () => {
  const outcomes = Object.entries(outcomeMap)

  it('should cover every outcome in the map', () => {
    expect(outcomes.map(([, { code }]) => code).sort()).toEqual(Object.keys(deliusDescriptions).sort())
  })

  it.each(outcomes)('%s should be found by its Delius description', (key, item) => {
    expect(getMappedOutcome({ description: deliusDescriptions[item.code] })).toEqual([key, item])
  })

  it.each(outcomes)('%s should be found by its map description', (key, item) => {
    expect(getMappedOutcome({ description: item.description })).toEqual([key, item])
  })

  it('should not have two outcomes with the same description once whitespace and case are ignored', () => {
    const normalised = outcomes.map(([, { description }]) => description.replace(/\s+/g, '').toLowerCase())
    expect(new Set(normalised).size).toBe(outcomes.length)
  })
})
