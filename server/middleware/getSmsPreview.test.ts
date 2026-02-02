import httpMocks from 'node-mocks-http'
import { getSmsPreview } from './getSmsPreview'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import ESupervisionClient from '../data/eSupervisionClient'
import { isoFromDateTime, setDataValue } from '../utils'
import { mockAppResponse } from '../controllers/mocks'
import { Location } from '../data/model/caseload'
import { AppointmentSession } from '../models/Appointments'
import { SmsPreviewRequest, SmsPreviewResponse } from '../data/model/esupervision'
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
  }
})

const crn = 'X000001'
const uuid = '67b8ca88-d326-4e42-9d7d-cd1374da5e62'
const username = 'user-1'
const locationCode = '1234'
const appointmentLocation = 'Leamington Probation Office'
const buildingName = 'Building One'

const mockSetDataValue = setDataValue as jest.MockedFunction<typeof setDataValue>

const mockSmsPreview: SmsPreviewResponse = {
  englishSmsPreview:
    'Dear James,\n\nYou have an appointment at Leamington Probation Office on Monday 11 August at 2pm.\n\nThis is an automated message. Do not reply.',
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
  sensitivity: 'Yes',
  outcomeRecorded: 'Yes',
  smsPreview: mockSmsPreview,
}

const postSmsPreviewSpy = jest
  .spyOn(ESupervisionClient.prototype, 'postSmsPreview')
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

const mockLocations: Location[] = [{ id: 1, code: locationCode, address: { officeName: appointmentLocation } }]

const buildRequest = ({
  appointment = mockAppointmentSession,
  locations = mockLocations,
  preferredLanguage = '',
} = {}): httpMocks.MockRequest<any> => {
  const req = {
    params: {
      crn,
      id: uuid,
    },
    session: {
      data: {
        locations: {
          [username]: locations,
        },
        appointments: {
          [crn]: {
            [uuid]: appointment,
          },
        },
        personalDetails: {
          [crn]: { overview: { preferredLanguage } },
        },
      },
    },
  }
  return httpMocks.createRequest(req)
}

describe('middleware/getSmsPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('SMS preview session exists for current crn', () => {
    const req = buildRequest()
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should not request the sms preview(s) from the api', () => {
      expect(postSmsPreviewSpy).not.toHaveBeenCalled()
    })
    it('should set res.locals.smsPreview to the session value', () => {
      expect(res.locals.smsPreview).toEqual(mockSmsPreview)
    })
    it('should return next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('SMS preview session does not exist for current crn', () => {
    const req = buildRequest({ appointment: { ...mockAppointmentSession, smsPreview: undefined } })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the sms preview(s) from the api', () => {
      const expectedRequest: SmsPreviewRequest = {
        firstName: 'James',
        appointmentLocation,
        dateAndTimeOfAppointment: isoFromDateTime(mockAppointmentSession.date, mockAppointmentSession.start),
        includeWelshPreview: false,
        appointmentType: mockAppointmentSession.type,
      }
      expect(postSmsPreviewSpy).toHaveBeenCalledWith(expectedRequest)
    })
    it('should set the api response as the session sms preview', () => {
      expect(mockSetDataValue).toHaveBeenCalledWith(
        req.session.data,
        ['appointments', crn, uuid, 'smsPreview'],
        mockSmsPreview,
      )
    })
    it('should set res.locals.smsPreview to the api response', () => {
      expect(res.locals.smsPreview).toEqual(mockSmsPreview)
    })
    it('should return next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('POP postcode is welsh', () => {
    const req = buildRequest({
      preferredLanguage: 'Welsh',
      appointment: { ...mockAppointmentSession, smsPreview: undefined },
    })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the sms preview(s) from the api', () => {
      const expectedRequest: SmsPreviewRequest = {
        firstName: 'James',
        appointmentLocation,
        dateAndTimeOfAppointment: isoFromDateTime(mockAppointmentSession.date, mockAppointmentSession.start),
        includeWelshPreview: true,
        appointmentType: mockAppointmentSession.type,
      }
      expect(postSmsPreviewSpy).toHaveBeenCalledWith(expectedRequest)
    })
  })

  describe('api request returns a 500 error', () => {
    const req = buildRequest({ appointment: { ...mockAppointmentSession, smsPreview: undefined } })
    beforeEach(async () => {
      postSmsPreviewSpy.mockImplementationOnce(() => Promise.resolve({ errors: [{ text: '500 error' }] }))
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should set the session sms preview as null', () => {
      expect(mockSetDataValue).toHaveBeenCalledWith(req.session.data, ['appointments', crn, uuid, 'smsPreview'], null)
    })
    it('should set res.locals.smsPreview to null', () => {
      expect(res.locals.smsPreview).toBeNull()
    })
  })

  describe('api request returns a 404 error (null)', () => {
    const req = buildRequest({ appointment: { ...mockAppointmentSession, smsPreview: undefined } })
    beforeEach(async () => {
      postSmsPreviewSpy.mockImplementationOnce(() => Promise.resolve(null))
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should set the session sms preview as null', () => {
      expect(mockSetDataValue).toHaveBeenCalledWith(req.session.data, ['appointments', crn, uuid, 'smsPreview'], null)
    })
    it('should set res.locals.smsPreview to null', () => {
      expect(res.locals.smsPreview).toBeNull()
    })
  })
  describe('server throws an error', () => {
    const loggerSpy = jest.spyOn(logger, 'error')
    const error = 'Server timeout'
    const req = buildRequest({ appointment: { ...mockAppointmentSession, smsPreview: undefined } })
    beforeEach(async () => {
      postSmsPreviewSpy.mockImplementationOnce(() => Promise.reject(new Error(error)))
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should log the error', () => {
      expect(loggerSpy).toHaveBeenCalledWith(`SMS preview request error: ${error}`)
    })
    it('should set the session sms preview as null', () => {
      expect(mockSetDataValue).toHaveBeenCalledWith(req.session.data, ['appointments', crn, uuid, 'smsPreview'], null)
    })
    it('should set res.locals.smsPreview to null', () => {
      expect(res.locals.smsPreview).toBeNull()
    })
  })

  describe('Only building name listed for matching location', () => {
    const locations: Location[] = [{ id: 1, code: locationCode, address: { buildingName } }]
    const req = buildRequest({ locations, appointment: { ...mockAppointmentSession, smsPreview: undefined } })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the sms preview(s) from the api', () => {
      const expectedRequest: SmsPreviewRequest = {
        firstName: 'James',
        appointmentLocation: buildingName,
        dateAndTimeOfAppointment: isoFromDateTime(mockAppointmentSession.date, mockAppointmentSession.start),
        includeWelshPreview: false,
        appointmentType: mockAppointmentSession.type,
      }
      expect(postSmsPreviewSpy).toHaveBeenCalledWith(expectedRequest)
    })
  })

  describe('No matching location found', () => {
    const locations: Location[] = [{ id: 1, code: '5678', address: { officeName: appointmentLocation } }]
    const req = buildRequest({ locations, appointment: { ...mockAppointmentSession, smsPreview: undefined } })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the sms preview(s) from the api', () => {
      const expectedRequest: SmsPreviewRequest = {
        firstName: 'James',
        dateAndTimeOfAppointment: isoFromDateTime(mockAppointmentSession.date, mockAppointmentSession.start),
        includeWelshPreview: false,
        appointmentType: mockAppointmentSession.type,
      }
      expect(postSmsPreviewSpy).toHaveBeenCalledWith(expectedRequest)
    })
  })
})
