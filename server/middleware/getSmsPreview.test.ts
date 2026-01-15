import httpMocks from 'node-mocks-http'
import { getSmsPreview } from './getSmsPreview'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import { setDataValue } from '../utils'
import { mockAppResponse } from '../controllers/mocks'
import { AppointmentSession, SmsPreviewRequest, SmsPreviewResponse } from '../models/Appointments'
import logger from '../../logger'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    setDataValue: jest.fn(),
    isWelshPostcode: jest.fn(() => false),
  }
})

const crn = 'X000001'
const uuid = '67b8ca88-d326-4e42-9d7d-cd1374da5e62'
const username = 'user-1'
const locationCode = '1234'
const location = 'Leamington Probation Office'
const buildingName = 'Building One'

const mockSetDataValue = setDataValue as jest.MockedFunction<typeof setDataValue>

const mockSmsPreview: SmsPreviewResponse = {
  preview: [
    'Dear James,\n\nYou have an appointment at Leamington Probation Office on Monday 11 August at 2pm.\n\nThis is an automated message. Do not reply.',
  ],
}

const smsPreviewSession = {
  preview: [
    'Dear James,\n\nYou have an appointment at Leamington Probation Office on Monday 12 August at 4pm.\n\nThis is an automated message. Do not reply.',
  ],
  welsh: false,
  location,
  name: 'James',
  date: '12/1/2025',
  start: '09:00',
}

const mockAppointmentSession: AppointmentSession = {
  user: {
    username,
    teamCode: 'mock-team-code',
    locationCode,
  },
  eventId: '1',
  type: 'C084',
  date: '2044-12-22T09:15:00.382936Z[Europe/London]',
  start: '2044-12-22T09:15:00.382936Z[Europe/London]',
  end: '2044-12-22T09:15:00.382936Z[Europe/London]',
  repeating: 'No',
  interval: 'DAY',
  numberOfAppointments: '1',
  numberOfRepeatAppointments: '0',
  sensitivity: 'Yes',
  outcomeRecorded: 'Yes',
  smsPreview: smsPreviewSession,
}

const postSmsPreviewSpy = jest
  .spyOn(MasApiClient.prototype, 'postSmsPreview')
  .mockImplementation(() => Promise.resolve(mockSmsPreview))

const res = mockAppResponse({
  case: {
    name: { forename: 'James', surname: 'Morrison' },
    mainAddress: {
      postcode: 'MN12 4PP',
    },
  },
})
const hmppsAuthClient = new HmppsAuthClient(tokenStore)

const nextSpy = jest.fn()

describe('middleware/getSmsPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('SMS preview session exists for current crn', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id: uuid,
      },
      session: {
        data: {
          locations: {
            [username]: [{ code: locationCode, address: { officeName: location } }],
          },
          appointments: {
            [crn]: {
              [uuid]: mockAppointmentSession,
            },
          },
        },
      },
    })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should not request the sms preview(s) from the api', () => {
      expect(postSmsPreviewSpy).not.toHaveBeenCalled()
    })
    it('should set res.locals.smsPreview to the session value', () => {
      expect(res.locals.smsPreview).toEqual(smsPreviewSession.preview)
    })
    it('should return next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
  describe('SMS preview session does not exist for current crn', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id: uuid,
      },
      session: {
        data: {
          locations: {
            [username]: [{ code: locationCode, address: { officeName: location } }],
          },
          appointments: {
            [crn]: {
              [uuid]: { ...mockAppointmentSession, smsPreview: undefined },
            },
          },
        },
      },
    })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the sms preview(s) from the api', () => {
      const expectedRequest: SmsPreviewRequest = {
        name: 'James',
        location,
        date: mockAppointmentSession.date,
        start: mockAppointmentSession.start,
        welsh: false,
      }
      expect(postSmsPreviewSpy).toHaveBeenCalledWith(expectedRequest)
    })
    it('should set the api response as the session sms preview', () => {
      expect(mockSetDataValue).toHaveBeenCalledWith(req.session.data, ['appointments', crn, uuid, 'smsPreview'], {
        name: 'James',
        location,
        welsh: false,
        preview: mockSmsPreview.preview,
      })
    })
    it('should set res.locals.smsPreview to the api response', () => {
      expect(res.locals.smsPreview).toEqual(mockSmsPreview.preview)
    })
    it('should return next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('api request returns a 500 error', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id: uuid,
      },
      session: {
        data: {
          locations: {
            [username]: [{ code: locationCode, address: { officeName: location } }],
          },
          appointments: {
            [crn]: {
              [uuid]: { ...mockAppointmentSession, smsPreview: undefined },
            },
          },
        },
      },
    })
    beforeEach(async () => {
      postSmsPreviewSpy.mockImplementationOnce(() => Promise.resolve({ errors: [{ text: '500 error' }] }))
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should set the session sms preview as null', () => {
      expect(mockSetDataValue).toHaveBeenCalledWith(req.session.data, ['appointments', crn, uuid, 'smsPreview'], {
        name: 'James',
        location,
        welsh: false,
        preview: null,
      })
    })
    it('should set res.locals.smsPreview to null', () => {
      expect(res.locals.smsPreview).toBeNull()
    })
  })
  describe('api request returns a 404 error (null)', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id: uuid,
      },
      session: {
        data: {
          locations: {
            [username]: [{ code: locationCode, address: { officeName: location } }],
          },
          appointments: {
            [crn]: {
              [uuid]: { ...mockAppointmentSession, smsPreview: undefined },
            },
          },
        },
      },
    })
    beforeEach(async () => {
      postSmsPreviewSpy.mockImplementationOnce(() => Promise.resolve(null))
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should set the session sms preview as null', () => {
      expect(mockSetDataValue).toHaveBeenCalledWith(req.session.data, ['appointments', crn, uuid, 'smsPreview'], {
        name: 'James',
        location,
        welsh: false,
        preview: null,
      })
    })
    it('should set res.locals.smsPreview to null', () => {
      expect(res.locals.smsPreview).toBeNull()
    })
  })
  describe('server throws an error', () => {
    const loggerSpy = jest.spyOn(logger, 'error')
    const error = 'Server timeout'
    const req = httpMocks.createRequest({
      params: {
        crn,
        id: uuid,
      },
      session: {
        data: {
          locations: {
            [username]: [{ code: locationCode, address: { officeName: location } }],
          },
          appointments: {
            [crn]: {
              [uuid]: { ...mockAppointmentSession, smsPreview: undefined },
            },
          },
        },
      },
    })
    beforeEach(async () => {
      postSmsPreviewSpy.mockImplementationOnce(() => Promise.reject(new Error(error)))
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should log the error', () => {
      expect(loggerSpy).toHaveBeenCalledWith(`SMS preview request error: ${error}`)
    })
    it('should set the session sms preview as null', () => {
      expect(mockSetDataValue).toHaveBeenCalledWith(req.session.data, ['appointments', crn, uuid, 'smsPreview'], {
        name: 'James',
        location,
        welsh: false,
        preview: null,
      })
    })
    it('should set res.locals.smsPreview to null', () => {
      expect(res.locals.smsPreview).toBeNull()
    })
  })

  describe('Only building name listed for matching location', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id: uuid,
      },
      session: {
        data: {
          locations: {
            [username]: [{ code: locationCode, address: { buildingName } }],
          },
          appointments: {
            [crn]: {
              [uuid]: { ...mockAppointmentSession, smsPreview: undefined },
            },
          },
        },
      },
    })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the sms preview(s) from the api', () => {
      const expectedRequest: SmsPreviewRequest = {
        name: 'James',
        location: buildingName,
        date: mockAppointmentSession.date,
        start: mockAppointmentSession.start,
        welsh: false,
      }
      expect(postSmsPreviewSpy).toHaveBeenCalledWith(expectedRequest)
    })
    it('should set the session sms preview with the correct location', () => {
      expect(mockSetDataValue).toHaveBeenCalledWith(req.session.data, ['appointments', crn, uuid, 'smsPreview'], {
        name: 'James',
        location: buildingName,
        welsh: false,
        preview: mockSmsPreview.preview,
      })
    })
  })

  describe('No matching location found', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id: uuid,
      },
      session: {
        data: {
          locations: {
            [username]: [{ code: '5678', address: { officeName: location } }],
          },
          appointments: {
            [crn]: {
              [uuid]: { ...mockAppointmentSession, smsPreview: undefined },
            },
          },
        },
      },
    })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the sms preview(s) from the api', () => {
      const expectedRequest: SmsPreviewRequest = {
        name: 'James',
        date: mockAppointmentSession.date,
        start: mockAppointmentSession.start,
        welsh: false,
      }
      expect(postSmsPreviewSpy).toHaveBeenCalledWith(expectedRequest)
    })
    it('should set the session sms preview with the correct location', () => {
      expect(mockSetDataValue).toHaveBeenCalledWith(req.session.data, ['appointments', crn, uuid, 'smsPreview'], {
        name: 'James',
        location: '',
        welsh: false,
        preview: mockSmsPreview.preview,
      })
    })
  })
})
