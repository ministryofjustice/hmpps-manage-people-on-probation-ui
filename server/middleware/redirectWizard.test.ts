import httpMocks from 'node-mocks-http'
import { redirectWizard } from './redirectWizard'
import { getDataValue, isValidCrn, isValidUUID } from '../utils'
import { renderError } from './renderError'
import { AppointmentSession } from '../models/Appointments'
import { AppResponse } from '../models/Locals'

const crn = 'X000001'
const uuid = '4715aa09-0f9d-4c18-948b-a42c45bc0974'

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    isValidCrn: jest.fn(),
    isValidUUID: jest.fn(),
    getDataValue: jest.fn(),
  }
})
const mockMiddlewareFn = jest.fn()

jest.mock('./renderError', () => ({
  renderError: jest.fn(() => mockMiddlewareFn),
}))

const mockRenderError = renderError as jest.MockedFunction<typeof renderError>
const mockedIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>
const mockedIsValidUUID = isValidUUID as jest.MockedFunction<typeof isValidUUID>
const mockedGetDataValue = getDataValue as jest.MockedFunction<typeof getDataValue>

const mockAppointment: AppointmentSession = {
  user: {
    username: 'user-1',
    teamCode: 'mock-team-code',
    locationCode: 'mock-location-code',
  },
  type: 'C084',
  date: '2044-12-22T09:15:00.382936Z[Europe/London]',
  start: '2044-12-22T09:15:00.382936Z[Europe/London]',
  end: '2044-12-22T09:15:00.382936Z[Europe/London]',
  repeating: 'Yes',
  interval: '',
  numberOfAppointments: '',
  uuid,
}

const req = httpMocks.createRequest({
  params: {
    crn,
    id: uuid,
  },
  session: {
    data: {
      appointments: {
        [crn]: {
          [uuid]: mockAppointment,
        },
      },
    },
  },
})

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

describe('/middleware/redirectWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('location is required, but it is undefined in the session appointment', () => {
    const requiredValues = [['user', 'locationCode']]
    beforeEach(() => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      redirectWizard(requiredValues)(req, res, nextSpy)
    })
    it('should redirect to the first page of the arrange appointment wizard', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/type`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
  describe('type and location are required, but location is undefined in the session appointment', () => {
    const requiredValues = ['type', ['user', 'locationCode']]
    beforeEach(() => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      redirectWizard(requiredValues)(req, res, nextSpy)
    })
    it('should redirect to the first page of the arrange appointment wizard', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/type`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
  describe('type is required, and it is available in the session appointment', () => {
    const requiredValues = ['type']
    beforeEach(() => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      mockedGetDataValue.mockReturnValue('type')
      redirectWizard(requiredValues)(req, res, nextSpy)
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

    beforeEach(() => {
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      mockedGetDataValue.mockReturnValue(null)
      redirectWizard(requiredValues)(req, res, nextSpy)
    })
    it('should return a 404 status and render the error page', () => {
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
    it('should not redirect to the first page of the arrange appointment wizard', () => {
      expect(redirectSpy).not.toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/type`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
})
