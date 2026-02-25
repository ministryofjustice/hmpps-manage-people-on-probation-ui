import httpMocks from 'node-mocks-http'
import { getSmsPreview } from './getSmsPreview'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { isoFromDateTime, setDataValue } from '../utils'
import { mockAppResponse } from '../controllers/mocks'
import { Location } from '../data/model/caseload'
import { AppointmentSession } from '../models/Appointments'
import { SmsPreviewRequest, SmsPreviewResponse, SmsPreviewSession } from '../data/model/OutlookEvent'
import logger from '../../logger'
import SupervisionAppointmentClient from '../data/SupervisionAppointmentClient'
import { Data } from '../models/Data'

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
const date = '2026-12-22'
const start = '15:00'
const type = 'C084'

const mockSmsPreview: SmsPreviewResponse = {
  englishSmsPreview:
    'Dear James,\n\nYou have an appointment at Leamington Probation Office on Monday 11 August at 2pm.\n\nThis is an automated message. Do not reply.',
}

const constructMockAppointmentSession = (smsPreviewRequest = {}): AppointmentSession => ({
  user: {
    username,
    teamCode: 'mock-team-code',
    locationCode,
  },
  eventId: '1',
  type,
  date,
  start,
  end: '15:30',
  sensitivity: 'Yes',
  outcomeRecorded: 'Yes',
  smsPreview: {
    request: {
      firstName: 'James',
      dateAndTimeOfAppointment: `${date}T${start}:00.000Z`,
      appointmentTypeCode: type,
      includeWelshPreview: false,
      appointmentLocation,
      ...(smsPreviewRequest ?? {}),
    },
    preview: mockSmsPreview,
  },
})

const postSmsPreviewSpy = jest
  .spyOn(SupervisionAppointmentClient.prototype, 'postSmsPreview')
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
  appointment = constructMockAppointmentSession(),
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

const apiRequestChecks = (data: Data, requestBody: SmsPreviewRequest, expectedSession: SmsPreviewSession) => {
  it('should request the sms preview(s) from the api', () => {
    expect(postSmsPreviewSpy).toHaveBeenCalledWith(requestBody)
  })
  it('should set the sms preview session to the request and api response', () => {
    expect(mockSetDataValue).toHaveBeenCalledWith(data, ['appointments', crn, uuid, 'smsPreview'], expectedSession)
  })
  it('should set res.locals.smsPreview to the api response', () => {
    expect(res.locals.smsPreview).toEqual(mockSmsPreview)
  })
  it('should return next()', () => {
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
}

describe('middleware/getSmsPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const getRequestBody = () => {
    const mockAppointmentSession = constructMockAppointmentSession()
    return {
      firstName: 'James',
      appointmentLocation,
      dateAndTimeOfAppointment: isoFromDateTime(mockAppointmentSession.date, mockAppointmentSession.start),
      includeWelshPreview: false,
      appointmentTypeCode: mockAppointmentSession.type,
    }
  }

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
    const req = buildRequest({ appointment: { ...constructMockAppointmentSession(), smsPreview: undefined } })
    const mockAppointmentSession = constructMockAppointmentSession()
    const expectedRequestBody: SmsPreviewRequest = {
      firstName: 'James',
      appointmentLocation,
      dateAndTimeOfAppointment: isoFromDateTime(mockAppointmentSession.date, mockAppointmentSession.start),
      includeWelshPreview: false,
      appointmentTypeCode: mockAppointmentSession.type,
    }
    const expectedSession: SmsPreviewSession = {
      request: expectedRequestBody,
      preview: mockSmsPreview,
    }
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the sms preview(s) from the api', () => {
      expect(postSmsPreviewSpy).toHaveBeenCalledWith(expectedRequestBody)
    })
    it('should set the api response as the session sms preview', () => {
      expect(mockSetDataValue).toHaveBeenCalledWith(
        req.session.data,
        ['appointments', crn, uuid, 'smsPreview'],
        expectedSession,
      )
    })
    it('should set res.locals.smsPreview to the api response', () => {
      expect(res.locals.smsPreview).toEqual(mockSmsPreview)
    })
    it('should return next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('SMS preview session location does not match request', () => {
    const requestBody = getRequestBody()
    const expectedSession = { request: requestBody, preview: mockSmsPreview }
    const req = buildRequest({
      appointment: {
        ...constructMockAppointmentSession(),
        smsPreview: { request: { ...requestBody, appointmentLocation: undefined }, preview: mockSmsPreview },
      },
    })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    apiRequestChecks(req.session.data, requestBody, expectedSession)
  })

  describe('SMS preview session date and time does not match request', () => {
    const requestBody = getRequestBody()
    const expectedSession = { request: requestBody, preview: mockSmsPreview }
    const req = buildRequest({
      appointment: {
        ...constructMockAppointmentSession(),
        smsPreview: {
          request: { ...requestBody, dateAndTimeOfAppointment: `2026-11-12T13:00:00.000Z` },
          preview: mockSmsPreview,
        },
      },
    })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    apiRequestChecks(req.session.data, requestBody, expectedSession)
  })

  describe('SMS preview session type does not match request', () => {
    const requestBody = getRequestBody()
    const expectedSession = { request: requestBody, preview: mockSmsPreview }
    const req = buildRequest({
      appointment: {
        ...constructMockAppointmentSession(),
        smsPreview: {
          request: { ...requestBody, appointmentTypeCode: 'XXX' },
          preview: mockSmsPreview,
        },
      },
    })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    apiRequestChecks(req.session.data, requestBody, expectedSession)
  })

  describe('No location code in appointment session', () => {
    const appointment: AppointmentSession = {
      ...constructMockAppointmentSession(),
      user: { locationCode: null },
    }
    const req = buildRequest({ appointment })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    const expectedRequestBody: SmsPreviewRequest = {
      ...getRequestBody(),
      appointmentLocation: undefined,
    }
    const expectedSession = {
      request: expectedRequestBody,
      preview: mockSmsPreview,
    }
    apiRequestChecks(req.session.data, expectedRequestBody, expectedSession)
  })

  describe('Sms preview session request matches but preview is null', () => {
    const requestBody = getRequestBody()
    const expectedSession = { request: requestBody, preview: mockSmsPreview }
    const req = buildRequest({
      appointment: {
        ...constructMockAppointmentSession(),
        smsPreview: {
          request: requestBody,
          preview: null,
        },
      },
    })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    apiRequestChecks(req.session.data, requestBody, expectedSession)
  })

  describe('POP postcode is welsh', () => {
    const mockAppointmentSession = constructMockAppointmentSession()
    const req = buildRequest({
      preferredLanguage: 'Welsh',
      appointment: { ...mockAppointmentSession, smsPreview: undefined },
    })
    const expectedRequestBody: SmsPreviewRequest = {
      firstName: 'James',
      appointmentLocation,
      dateAndTimeOfAppointment: isoFromDateTime(mockAppointmentSession.date, mockAppointmentSession.start),
      includeWelshPreview: true,
      appointmentTypeCode: mockAppointmentSession.type,
    }
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the sms preview(s) from the api', () => {
      expect(postSmsPreviewSpy).toHaveBeenCalledWith(expectedRequestBody)
    })
  })

  describe('api request returns a 500 error', () => {
    const req = buildRequest({ appointment: { ...constructMockAppointmentSession(), smsPreview: undefined } })
    beforeEach(async () => {
      postSmsPreviewSpy.mockImplementationOnce(() => Promise.resolve({ errors: [{ text: '500 error' }] }))
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should set the session sms preview as null', () => {
      expect(mockSetDataValue).toHaveBeenCalledWith(req.session.data, ['appointments', crn, uuid, 'smsPreview'], {
        request: getRequestBody(),
        preview: null,
      })
    })
    it('should set res.locals.smsPreview to null', () => {
      expect(res.locals.smsPreview).toBeNull()
    })
  })

  describe('api request returns a 404 error (null)', () => {
    const req = buildRequest({ appointment: { ...constructMockAppointmentSession(), smsPreview: undefined } })
    beforeEach(async () => {
      postSmsPreviewSpy.mockImplementationOnce(() => Promise.resolve(null))
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should set the session sms preview as null', () => {
      expect(mockSetDataValue).toHaveBeenCalledWith(req.session.data, ['appointments', crn, uuid, 'smsPreview'], {
        request: getRequestBody(),
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
    const req = buildRequest({ appointment: { ...constructMockAppointmentSession(), smsPreview: undefined } })
    beforeEach(async () => {
      postSmsPreviewSpy.mockImplementationOnce(() => Promise.reject(new Error(error)))
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should log the error', () => {
      expect(loggerSpy).toHaveBeenCalledWith(`SMS preview request error: ${error}`)
    })
    it('should set the session sms preview as null', () => {
      expect(mockSetDataValue).toHaveBeenCalledWith(req.session.data, ['appointments', crn, uuid, 'smsPreview'], {
        request: getRequestBody(),
        preview: null,
      })
    })
    it('should set res.locals.smsPreview to null', () => {
      expect(res.locals.smsPreview).toBeNull()
    })
  })

  describe('Only building name listed for matching location', () => {
    const locations: Location[] = [{ id: 1, code: locationCode, address: { buildingName } }]
    const req = buildRequest({
      locations,
      appointment: { ...constructMockAppointmentSession(), smsPreview: undefined },
    })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the sms preview(s) from the api', () => {
      const expectedRequestBody: SmsPreviewRequest = {
        ...getRequestBody(),
        appointmentLocation: buildingName,
      }
      expect(postSmsPreviewSpy).toHaveBeenCalledWith(expectedRequestBody)
    })
  })

  describe('Only description listed for matching location', () => {
    const locations: Location[] = [
      { id: 1, code: locationCode, description: buildingName, address: { buildingName: '', officeName: '' } },
    ]
    const req = buildRequest({
      locations,
      appointment: { ...constructMockAppointmentSession(), smsPreview: undefined },
    })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the sms preview(s) from the api', () => {
      const expectedRequestBody: SmsPreviewRequest = {
        ...getRequestBody(),
        appointmentLocation: buildingName,
      }
      expect(postSmsPreviewSpy).toHaveBeenCalledWith(expectedRequestBody)
    })
  })

  describe('No matching location found', () => {
    const locations: Location[] = [{ id: 1, code: '5678', address: { officeName: appointmentLocation } }]
    const req = buildRequest({
      locations,
      appointment: { ...constructMockAppointmentSession(), smsPreview: undefined },
    })
    beforeEach(async () => {
      await getSmsPreview(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the sms preview(s) from the api', () => {
      const expectedRequest: SmsPreviewRequest = {
        ...getRequestBody(),
        appointmentLocation: undefined,
      }
      expect(postSmsPreviewSpy).toHaveBeenCalledWith(expectedRequest)
    })
  })
})
