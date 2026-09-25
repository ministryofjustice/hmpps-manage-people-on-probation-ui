import { ErrorSummary } from '../data/model/common'
import { MasUserDetails } from '../models/Appointments'
import { responseIsError, responseIsErrorSummary, RestClientError } from './responseIsError'

const userDetailsResponse: MasUserDetails = {
  userId: 1,
  username: 'user-1',
  firstName: 'John',
  surname: 'Doe',
  enabled: true,
  roles: ['role1', 'role2'],
}

const errorSummary: ErrorSummary = {
  errors: [{ text: 'error' }],
}

describe('utils/responseIsError', () => {
  it('should return false if not an error', () => {
    expect(responseIsError(userDetailsResponse)).toEqual(false)
  })
  it('should return true if 404 error (null)', () => {
    expect(responseIsError(null)).toEqual(true)
  })
  it('should return true if 500 error', () => {
    const response: RestClientError = {
      errors: [
        {
          text: 'error',
          href: '',
        },
      ],
    }
    expect(responseIsError(response)).toEqual(true)
  })
})

describe('utils/responseIsErrorSummary', () => {
  it('should return false if no response', () => {
    expect(responseIsErrorSummary(undefined)).toEqual(false)
  })
  it('should return false if a 200 response', () => {
    expect(responseIsErrorSummary(userDetailsResponse)).toEqual(false)
  })
  it('should return false if response is a 404 error (null)', () => {
    expect(responseIsErrorSummary(null)).toEqual(false)
  })
  it('should return true if a 500 error', () => {
    expect(responseIsErrorSummary(errorSummary)).toEqual(true)
  })
})
