import httpMocks from 'node-mocks-http'
import { restrictPageAccess } from './restrictPageAccess'
import { isValidCrn, isValidUUID } from '../utils'
import { renderError } from './renderError'
import { AppointmentSession } from '../models/Appointments'
import { AppResponse } from '../models/Locals'
import { CheckinUserDetails } from '../models/ESupervision'

const crn = 'X000001'
const uuid = '4715aa09-0f9d-4c18-948b-a42c45bc0974'

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    isValidCrn: jest.fn(),
    isValidUUID: jest.fn(),
  }
})
const mockMiddlewareFn = jest.fn()

jest.mock('./renderError', () => ({
  renderError: jest.fn(() => mockMiddlewareFn),
}))

const mockRenderError = renderError as jest.MockedFunction<typeof renderError>
const mockedIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>
const mockedIsValidUUID = isValidUUID as jest.MockedFunction<typeof isValidUUID>

const mockAppointment: AppointmentSession = {
  user: {
    username: 'user-1',
    teamCode: 'mock-team-code',
    locationCode: 'mock-location-code',
  },
  eventId: '1234',
  type: 'C084',
  date: '2044-12-22T09:15:00.382936Z[Europe/London]',
  start: '2044-12-22T09:15:00.382936Z[Europe/London]',
  end: '2044-12-22T09:15:00.382936Z[Europe/London]',
}

const buildRequest = ({
  _uuid = uuid,
  appointment = {},
  checkins = {},
}: {
  _uuid?: string
  appointment?: Partial<AppointmentSession>
  checkins?: Partial<CheckinUserDetails>
} = {}): httpMocks.MockRequest<any> => {
  const req = {
    params: {
      crn,
      id: uuid,
    },
    session: {
      data: {
        appointments: {
          [crn]: {
            [_uuid]: { ...mockAppointment, ...appointment },
          },
        },
        esupervision: {
          [crn]: {
            [_uuid]: {
              checkins: {
                id: 1,
                date: '2044-12-22',
                interval: 'WEEKLY',
                ...checkins,
              },
            },
          },
        },
      },
    },
  }
  return httpMocks.createRequest(req)
}

const res = {
  locals: {
    user: {
      username: 'user-1',
    },
  },
  redirect: jest.fn().mockReturnThis(),
  render: jest.fn().mockReturnThis(),
  status: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const redirectSpy = jest.spyOn(res, 'redirect')
const nextSpy = jest.fn()

describe('/middleware/restrictPageAccess - appointments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('active appointment session is required for current uuid', () => {
    beforeEach(() => {
      const req = buildRequest({ _uuid: '12345' })
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      restrictPageAccess()(req, res, nextSpy)
    })
    it('should redirect to the sentence page if uuid does not exist in session', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/sentence`)
    })
  })

  describe('location is required, but it is undefined in the session appointment', () => {
    const requiredValues = [['user', 'locationCode']]
    beforeEach(() => {
      const appointment: Partial<AppointmentSession> = {
        user: {
          ...mockAppointment.user,
          locationCode: undefined,
        },
      }
      const req = buildRequest({ appointment })
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      restrictPageAccess({ requiredValues })(req, res, nextSpy)
    })
    it('should redirect to the first page of the arrange appointment wizard', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })

  describe('type and location are required, but location is undefined in the session appointment', () => {
    const requiredValues = ['type', ['user', 'locationCode']]
    beforeEach(() => {
      const appointment: Partial<AppointmentSession> = {
        user: {
          ...mockAppointment.user,
          locationCode: undefined,
        },
      }
      const req = buildRequest({ appointment })
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      restrictPageAccess({ requiredValues })(req, res, nextSpy)
    })
    it('should redirect to the first page of the arrange appointment wizard', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })

  describe('type is required, and it is not available but eventID is provided and feature flag getAppointmentsSetup is on', () => {
    const requiredValues = ['type']
    beforeEach(() => {
      const appointment: Partial<AppointmentSession> = {
        ...mockAppointment.user,
        type: undefined,
      }
      const req = buildRequest({ appointment })
      const mockRes = {
        ...res,
        locals: {
          ...res.locals,
          flags: {
            enableAppointmentsSpeedup: true,
          },
        },
      } as AppResponse
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      restrictPageAccess({ requiredValues })(req, mockRes, nextSpy)
    })
    it('should redirect to type page (first uncompleted page)', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/type-attendance?`)
    })
  })

  describe('type is required, and it is available in the session appointment', () => {
    const requiredValues = ['type']
    beforeEach(() => {
      const req = buildRequest()
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      restrictPageAccess({ requiredValues })(req, res, nextSpy)
    })
    it('should not redirect to the first page of the arrange appointment wizard', () => {
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })

  describe('CRN and UUID in request url are invalid', () => {
    const requiredValues = [['user', 'locationCode']]
    const req = buildRequest()

    beforeEach(() => {
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      restrictPageAccess({ requiredValues })(req, res, nextSpy)
    })
    it('should return a 404 status and render the error page', () => {
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
    it('should not redirect to the first page of the arrange appointment wizard', () => {
      expect(redirectSpy).not.toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
})

describe('/middleware/restrictPageAccess - setupcheckins', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('active checkins session is required for current uuid', () => {
    beforeEach(() => {
      const req = buildRequest({ _uuid: '12345' })
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      restrictPageAccess({ route: 'setupcheckins' })(req, res, nextSpy)
    })
    it('should redirect to the sentence page if uuid does not exist in session', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/check-in/eligibility-check`)
    })
  })

  describe('date is required, but it is undefined in the session appointment', () => {
    const requiredValues = ['date']
    beforeEach(() => {
      const checkins: Partial<CheckinUserDetails> = { date: undefined }
      const req = buildRequest({ checkins })
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      restrictPageAccess({ requiredValues, route: 'setupcheckins' })(req, res, nextSpy)
    })
    it('should redirect to the first page of the setup wizard', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/${uuid}/check-in/eligibility-check`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
  describe('id is required, and it is available in the session', () => {
    const requiredValues = ['id']
    beforeEach(() => {
      const req = buildRequest()
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      restrictPageAccess({ requiredValues, route: 'setupcheckins' })(req, res, nextSpy)
    })
    it('should not redirect to the first page of the setup wizard', () => {
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })

  describe('CRN and UUID in request url are invalid', () => {
    const requiredValues = [['id']]
    const req = buildRequest()

    beforeEach(() => {
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      restrictPageAccess({ requiredValues, route: 'setupcheckins' })(req, res, nextSpy)
    })
    it('should return a 404 status and render the error page', () => {
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
    it('should not redirect to the first page of the setup wizard', () => {
      expect(redirectSpy).not.toHaveBeenCalledWith(`/case/${crn}/appointments/${uuid}/check-in/eligibility-check`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
})
