import httpMocks from 'node-mocks-http'
import { getSmsConfirmationOptions } from './getSmsConfirmationOptions'
import { mockAppResponse } from '../controllers/mocks'
import { AppResponse } from '../models/Locals'

const buildResponse = ({ enableAllowSms = true, mobileNumber = '07989654824' } = {}): AppResponse => {
  const locals = {
    flags: {
      enableAllowSms,
    },
    case: {
      mobileNumber,
    },
    smsConfirmationOption: undefined as any,
  }
  return mockAppResponse(locals)
}

describe('middleware/getSmsConfirmationOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const nextSpy = jest.fn()
  const req = httpMocks.createRequest()

  it('should only call next() if feature flag enabled and middleware is inline', () => {
    const res = buildResponse({ enableAllowSms: true })
    getSmsConfirmationOptions()(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledWith()
    expect(res.locals.smsConfirmationOptions).toBeUndefined()
  })

  it('should return the options if feature flag is enabled and middleware is not inline', () => {
    const res = buildResponse()
    const result = getSmsConfirmationOptions(false)(req, res, nextSpy)
    expect(nextSpy).not.toHaveBeenCalledWith()
    expect(result).toStrictEqual([
      { text: 'Yes', value: 'YES' },
      { text: 'Yes, update their mobile number', value: 'YES_UPDATE_MOBILE_NUMBER' },
      { text: 'No', value: 'NO' },
    ])
    expect(res.locals.smsConfirmationOptions).toBeUndefined()
  })

  it('should add the correct options to res.locals.smsConfirmationOptions if feature flag disabled and PoP has a mobile number', () => {
    const res = buildResponse({ enableAllowSms: false })
    getSmsConfirmationOptions()(req, res, nextSpy)
    expect(res.locals.smsConfirmationOptions).toStrictEqual([
      { text: 'Yes', value: 'YES' },
      { text: 'Yes, update their mobile number', value: 'YES_UPDATE_MOBILE_NUMBER' },
      { text: 'No', value: 'NO' },
    ])
    expect(nextSpy).toHaveBeenCalledWith()
  })

  it('should add the correct options to res.locals.smsConfirmationOptions if PoP does not have a mobile number', () => {
    const res = buildResponse({ enableAllowSms: false, mobileNumber: null })
    getSmsConfirmationOptions()(req, res, nextSpy)
    expect(res.locals.smsConfirmationOptions).toStrictEqual([
      { text: 'Yes, add a mobile number', value: 'YES_ADD_MOBILE_NUMBER' },
      { text: 'No', value: 'NO' },
    ])
    expect(nextSpy).toHaveBeenCalledWith()
  })
})
