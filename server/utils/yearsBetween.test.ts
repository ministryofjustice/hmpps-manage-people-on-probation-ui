import { yearsBetween } from './yearsBetween'

describe('utils/yearsBetween', () => {
  it('should return null if dob string is falsy', () => {
    const dobString = ''
    const dodString = '2025-04-10T00:00:00.123'
    expect(yearsBetween(dobString, dodString)).toBeNull()
  })
  it('should return null if dod string is falsy', () => {
    const dobString = '1967-05-25T00:00:00.123'
    const dodString = ''
    expect(yearsBetween(dobString, dodString)).toBeNull()
  })
  it('should return null if both dates are falsy', () => {
    expect(yearsBetween('', '')).toBeNull()
  })
  it('should return the correct age if month of death is before birth month', () => {
    const dobString = '1970-05-25T00:00:00.123'
    const dodString = '2025-04-10T00:00:00.123'
    expect(yearsBetween(dobString, dodString)).toEqual('54')
  })
  it('should return the correct age if month of death if after birth month', () => {
    const dobString = '1970-05-25T00:00:00.123'
    const dodString = '2025-08-10T00:00:00.123'
    expect(yearsBetween(dobString, dodString)).toEqual('55')
  })
  it('should return the correct age if month and day are the same for both birth and death dates', () => {
    const dobString = '1970-05-25T00:00:00.123'
    const dodString = '2025-05-25T00:00:00.123'
    expect(yearsBetween(dobString, dodString)).toEqual('55')
  })
})
