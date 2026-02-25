import httpMocks from 'node-mocks-http'
import { getSmsConfirmationOptions } from './getSmsConfirmationOptions'
import { mockAppResponse } from '../controllers/mocks'

describe('middleware/getSmsConfirmationOptions', () => {
  const nextSpy = jest.fn()
  const req = httpMocks.createRequest()
  it('should add the correct options to res.locals.smsConfirmationOptions if PoP has a mobile number', () => {
    const res = mockAppResponse({ case: { mobileNumber: '07989654824' } })
    getSmsConfirmationOptions(req, res, nextSpy)
    expect(res.locals.smsConfirmationOptions).toStrictEqual([
      { text: 'Yes', value: 'YES' },
      { text: 'Yes, update their mobile number', value: 'YES_UPDATE_MOBILE_NUMBER' },
      { text: 'No', value: 'NO' },
    ])
    expect(nextSpy).toHaveBeenCalled()
  })
  it('should add the correct options to res.locals.smsConfirmationOptions if PoP does not have a mobile number', () => {
    const res = mockAppResponse({ case: { mobileNumber: '' } })
    getSmsConfirmationOptions(req, res, nextSpy)
    expect(res.locals.smsConfirmationOptions).toStrictEqual([
      { text: 'Yes, add a mobile number', value: 'YES_ADD_MOBILE_NUMBER' },
      { text: 'No', value: 'NO' },
    ])
    expect(nextSpy).toHaveBeenCalled()
  })
})
