import { getMappedOutcome, getMappedActions } from './getMappedOutcome'
import { outcomeMap, enforcementActionMap, type OutcomeProps, ActionProps } from '../properties/appointment-outcomes'

jest.mock('../properties/appointment-outcomes', () => ({
  outcomeMap: {},
  enforcementActionMap: {},
}))

const mockedOutcomeMap = outcomeMap as jest.Mocked<typeof outcomeMap>
const mockedEnforcementActionMap = enforcementActionMap as jest.Mocked<typeof enforcementActionMap>

describe('utils/getMappedOutcome', () => {
  const values1: OutcomeProps = { code: 'ATTC', description: 'Attended - Complied' }
  const values2: OutcomeProps = { code: 'AFTC', description: 'Attended - Failed To Comply' }
  mockedOutcomeMap.ATTENDED_COMPLIED = values1
  mockedOutcomeMap.ATTENDED_FAILED_TO_COMPLY = values2
  it('should return null if no code or description in params', () => {
    expect(getMappedOutcome()).toBeNull()
  })
  it('should not return null if code if description was not matched', () => {
    expect(getMappedOutcome({ description: 'XXXX' })).toBeNull()
  })
  it('should not return an outcome if code if code was not matched', () => {
    expect(getMappedOutcome({ code: 'XXXX' })).toBeNull()
  })
  it('should return the mapped outcome matched by description', () => {
    expect(getMappedOutcome({ description: 'Attended - Complied' })).toEqual(['ATTENDED_COMPLIED', values1])
  })
  it('should return the mapped outcome matched by code', () => {
    expect(getMappedOutcome({ code: 'AFTC' })).toEqual(['ATTENDED_FAILED_TO_COMPLY', values2])
  })
})

describe('utils/getMappedActions', () => {
  const values1: ActionProps = { code: 'IBR', description: 'Breach / Recall Initiated' }
  const values2: ActionProps = { code: 'EA02', description: 'First Warning Letter Sent' }
  mockedEnforcementActionMap.BREACH_RECALL_INITIATED = values1
  mockedEnforcementActionMap.FIRST_WARNING_LETTER_SENT = values2
  it('should return null if no code in params', () => {
    expect(getMappedActions()).toBeNull()
  })
  it('should return null if code was not matched', () => {
    expect(getMappedActions(['XXX'])).toBeNull()
  })
  it('should return a single mapped action', () => {
    expect(getMappedActions(['IBR'])).toEqual([['BREACH_RECALL_INITIATED', values1]])
  })
  it('should return a single mapped action if only one code was matched', () => {
    expect(getMappedActions(['IBR', 'XXX'])).toEqual([['BREACH_RECALL_INITIATED', values1]])
  })
  it('should return a multiple mapped actions', () => {
    expect(getMappedActions(['IBR', 'EA02'])).toEqual([
      ['BREACH_RECALL_INITIATED', values1],
      ['FIRST_WARNING_LETTER_SENT', values2],
    ])
  })
})
