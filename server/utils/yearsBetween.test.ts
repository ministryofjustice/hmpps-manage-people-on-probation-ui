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
  it.each([
    {
      description: 'month of death is before birth month',
      dobString: '1970-05-25T00:00:00.123',
      dodString: '2025-04-10T00:00:00.123',
      expectedAge: '54',
    },
    {
      description: 'month of death is after birth month',
      dobString: '1970-05-25T00:00:00.123',
      dodString: '2025-08-10T00:00:00.123',
      expectedAge: '55',
    },
    {
      description: 'month and day are the same for both birth and death dates',
      dobString: '1970-05-25T00:00:00.123',
      dodString: '2025-05-25T00:00:00.123',
      expectedAge: '55',
    },
  ])('should return the correct age if $description', ({ dobString, dodString, expectedAge }) => {
    expect(yearsBetween(dobString, dodString)).toEqual(expectedAge)
  })
})
