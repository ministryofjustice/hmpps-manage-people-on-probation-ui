import httpMocks from 'node-mocks-http'
import { forceValidation } from './forceValidation'
import { getDataValue } from '../utils'

const id = '304bddc2-cfa5-4a33-92e2-ee31fc93d627'
const crn = 'X000001'

jest.mock('../utils', () => ({
  getDataValue: jest.fn(),
}))

const getDataValueSpy = getDataValue as jest.MockedFunction<typeof getDataValue>

const buildRequest = (request: Record<string, any> = {}): httpMocks.MockRequest<any> => {
  const req = {
    params: {
      crn,
      id,
    },
    query: {
      validation: 'true',
    },
    url: '/sentence',
    session: {
      data: {},
    },
    ...request,
  }
  return httpMocks.createRequest(req)
}

const res = httpMocks.createResponse()
const nextSpy = jest.fn()

describe('forceValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should just return next() if validation query is not present', () => {
    const req = buildRequest({ query: {} })
    forceValidation(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(res.locals.errorMessages).toBeUndefined()
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the correct error message for sentence page', () => {
    const req = buildRequest()
    forceValidation(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    const expectedErrorMessages = {
      [`appointments-${crn}-${id}-eventId`]: 'Select what this appointment is for',
    }
    expect(res.locals.errorMessages).toStrictEqual(expectedErrorMessages)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the correct error message for type attendance page', () => {
    const req = buildRequest({ url: '/type-attendance' })
    forceValidation(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    const expectedErrorMessages = {
      [`appointments-${crn}-${id}-type`]: 'Select an appointment type',
    }
    expect(res.locals.errorMessages).toStrictEqual(expectedErrorMessages)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the correct error message for location, date and time page and location is selected', () => {
    getDataValueSpy.mockReturnValueOnce('mock-location-code')
    const req = buildRequest({ url: '/location-date-time' })
    forceValidation(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    const expectedErrorMessages = {
      [`appointments-${crn}-${id}-date`]: 'Enter or select a date',
      [`appointments-${crn}-${id}-start`]: 'Enter a start time',
      [`appointments-${crn}-${id}-end`]: 'Enter an end time',
    }
    expect(res.locals.errorMessages).toStrictEqual(expectedErrorMessages)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the correct error message for location, date and time page and location is not selected', () => {
    getDataValueSpy.mockReturnValueOnce(undefined)
    const req = buildRequest({ url: '/location-date-time' })
    forceValidation(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    const expectedErrorMessages = {
      [`appointments-${crn}-${id}-date`]: 'Enter or select a date',
      [`appointments-${crn}-${id}-start`]: 'Enter a start time',
      [`appointments-${crn}-${id}-end`]: 'Enter an end time',
      [`appointments-${crn}-${id}-user-locationCode`]: 'Select an appointment location',
    }
    expect(res.locals.errorMessages).toStrictEqual(expectedErrorMessages)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the correct error message for outcome page', () => {
    const req = buildRequest({ url: '/outcome' })
    forceValidation(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    const expectedErrorMessages = {
      [`appointments-${crn}-${id}-outcome-outcomeType`]: 'Select why they will not attend this appointment',
    }
    expect(res.locals.errorMessages).toStrictEqual(expectedErrorMessages)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the correct error message for supporting information page', () => {
    const req = buildRequest({ url: '/supporting-information' })
    forceValidation(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    const expectedErrorMessages = {
      [`appointments-${crn}-${id}-sensitivity`]:
        'Select whether or not the appointment note contains sensitive information',
    }
    expect(res.locals.errorMessages).toStrictEqual(expectedErrorMessages)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the correct error message for add note page', () => {
    const req = buildRequest({ url: '/add-note' })
    forceValidation(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    const expectedErrorMessages = {
      [`appointments-${crn}-${id}-sensitivity`]:
        'Select whether or not the appointment note contains sensitive information',
    }
    expect(res.locals.errorMessages).toStrictEqual(expectedErrorMessages)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
