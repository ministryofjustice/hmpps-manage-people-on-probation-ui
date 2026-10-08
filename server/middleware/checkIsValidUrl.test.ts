import httpMocks from 'node-mocks-http'
import { isValidCrn, isValidUUID, isNumericString } from '../utils'
import { checkIsValidUrl } from './checkIsValidUrl'
import { renderError } from './renderError'

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    isValidCrn: jest.fn(),
    isValidUUID: jest.fn(),
    isNumericString: jest.fn(),
    setDataValue: jest.fn(),
  }
})

const mockMiddlewareFn = jest.fn()
jest.mock('./renderError', () => ({
  renderError: jest.fn(() => mockMiddlewareFn),
}))

const mockedIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>
const mockedIsValidUUID = isValidUUID as jest.MockedFunction<typeof isValidUUID>
const mockedIsNumericString = isNumericString as jest.MockedFunction<typeof isNumericString>
const mockRenderError = renderError as jest.MockedFunction<typeof renderError>
const nextSpy = jest.fn()
const crn = 'X000001'
const uuid = 'fd328f5e-e0c6-408f-a938-b4a3edc0d548'
const contactId = '12345'

const buildRequest = ({ id = undefined, _contactId = undefined } = {}): httpMocks.MockRequest<any> => {
  return httpMocks.createRequest({ params: { id, contactId: _contactId, crn } })
}

const res = httpMocks.createResponse()

describe('middleware/checkIsValidUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should validate the uuid if exists in url', () => {
    const req = buildRequest({ id: uuid })
    checkIsValidUrl(req, res, nextSpy)
    expect(mockedIsValidUUID).toHaveBeenCalledWith(uuid)
    expect(mockedIsNumericString).not.toHaveBeenCalled()
    expect(isValidCrn).toHaveBeenCalledWith(crn)
  })
  it('should validate the contactId if exists in url', () => {
    const req = buildRequest({ _contactId: contactId })
    checkIsValidUrl(req, res, nextSpy)
    expect(mockedIsNumericString).toHaveBeenCalledWith(contactId)
    expect(mockedIsValidUUID).not.toHaveBeenCalled()
    expect(isValidCrn).toHaveBeenCalledWith(crn)
  })
  it('should return a 400 error if invalid crn', async () => {
    const req = buildRequest({ id: uuid })
    mockedIsValidCrn.mockReturnValue(false)
    mockedIsValidUUID.mockReturnValue(true)
    checkIsValidUrl(req, res, nextSpy)
    expect(mockRenderError).toHaveBeenCalledWith(404)
    expect(nextSpy).not.toHaveBeenCalled()
  })
  it('should return a 400 error if invalid UUID', async () => {
    const req = buildRequest({ id: uuid })
    mockedIsValidCrn.mockReturnValue(true)
    mockedIsValidUUID.mockReturnValue(false)
    checkIsValidUrl(req, res, nextSpy)
    expect(mockRenderError).toHaveBeenCalledWith(404)
    expect(nextSpy).not.toHaveBeenCalled()
  })
  it('should return a 400 error if invalid contactId', async () => {
    const req = buildRequest({ _contactId: contactId })
    mockedIsValidCrn.mockReturnValue(true)
    mockedIsNumericString.mockReturnValue(false)
    checkIsValidUrl(req, res, nextSpy)
    expect(mockRenderError).toHaveBeenCalledWith(404)
    expect(nextSpy).not.toHaveBeenCalled()
  })

  it('should return next if url has valid crn and uuid', () => {
    const req = buildRequest({ id: uuid })
    mockedIsValidCrn.mockReturnValue(true)
    mockedIsValidUUID.mockReturnValue(true)
    checkIsValidUrl(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should return next if url has valid crn and contactId', () => {
    const req = buildRequest({ _contactId: contactId })
    mockedIsValidCrn.mockReturnValue(true)
    mockedIsNumericString.mockReturnValue(true)
    checkIsValidUrl(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
