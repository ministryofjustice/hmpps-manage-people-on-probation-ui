import { MasUserDetails } from '../models/Appointments'
import { responseIsError, RestClientError } from './responseIsError'

describe('utils/responseIsError', () => {
  it('should return false if not an error', () => {
    const userDetailsResponse: MasUserDetails = {
      userId: 1,
      username: 'user-1',
      firstName: 'John',
      surname: 'Doe',
      enabled: true,
      roles: ['role1', 'role2'],
    }
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
