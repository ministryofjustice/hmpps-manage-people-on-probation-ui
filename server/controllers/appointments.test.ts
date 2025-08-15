import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import logger from '../../logger'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import { toRoshWidget, toPredictors, isValidCrn, isNumericString } from '../utils'
import {
  mockTierCalculation,
  mockRisks,
  mockPredictors,
  mockAppResponse,
  mockPersonSchedule,
  mockPersonAppointment,
} from './mocks'
import { checkAuditMessage } from './testutils'
import { renderError } from '../middleware'

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const id = '1234'
const contactId = '1234'
const actionType = 'mockType'

jest.mock('../data/masApiClient')
jest.mock('../data/tokenStore/redisTokenStore')
jest.mock('@ministryofjustice/hmpps-audit-client')
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'f1654ea3-0abb-46eb-860b-654a96edbe20'),
}))
jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})
jest.mock('../data/arnsApiClient')

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    toRoshWidget: jest.fn(),
    toPredictors: jest.fn(),
    isValidCrn: jest.fn(),
    isNumericString: jest.fn(),
  }
})
const mockMiddlewareFn = jest.fn()
jest.mock('../middleware', () => ({
  renderError: jest.fn(() => mockMiddlewareFn),
}))

const mockRenderError = renderError as jest.MockedFunction<typeof renderError>

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const mockIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>
const mockIsNumericString = isNumericString as jest.MockedFunction<typeof isNumericString>
tokenStore.getToken.mockResolvedValue(token.access_token)

const req = httpMocks.createRequest({
  params: {
    crn,
    id,
    contactId,
    actionType,
  },
  query: { page: '', view: 'default', category: 'mock-category' },
})

const res = mockAppResponse({
  filters: {
    dateFrom: '',
    dateTo: '',
    keywords: '',
  },
})

const renderSpy = jest.spyOn(res, 'render')
const statusSpy = jest.spyOn(res, 'status')
const redirectSpy = jest.spyOn(res, 'redirect')

const getPersonScheduleSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonSchedule')
  .mockImplementation(() => Promise.resolve(mockPersonSchedule))

const getPersonAppointmentSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonAppointment')
  .mockImplementation(() => Promise.resolve(mockPersonAppointment))

const getCalculationDetailsSpy = jest
  .spyOn(TierApiClient.prototype, 'getCalculationDetails')
  .mockImplementation(() => Promise.resolve(mockTierCalculation))

const getRisksSpy = jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockImplementation(() => Promise.resolve(mockRisks))
const getPredictorsSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getPredictorsAll')
  .mockImplementation(() => Promise.resolve(mockPredictors))

const loggerSpy = jest.spyOn(logger, 'info')

describe('controllers/appointments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('get appointments', () => {
    beforeEach(async () => {
      await controllers.appointments.getAppointments(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_APPOINTMENTS', uuidv4(), crn, 'CRN')
    it('should request previous and upcoming appointments from the api', () => {
      expect(getPersonScheduleSpy).toHaveBeenCalledWith(crn, 'upcoming', '0')
      expect(getPersonScheduleSpy).toHaveBeenCalledWith(crn, 'previous', '0')
    })
    it('should request risks from the api', () => {
      expect(getRisksSpy).toHaveBeenCalledWith(crn)
    })
    it('should request tier calculation details from the api', () => {
      expect(getCalculationDetailsSpy).toHaveBeenCalledWith(crn)
    })
    it('should request predictors from the api', () => {
      expect(getPredictorsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the appointments page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments', {
        upcomingAppointments: mockPersonSchedule,
        pastAppointments: mockPersonSchedule,
        crn,
        tierCalculation: mockTierCalculation,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
      })
    })
  })

  describe('get upcoming appointments', () => {
    beforeEach(async () => {
      await controllers.appointments.getAllUpcomingAppointments(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_ALL_UPCOMING_APPOINTMENTS', uuidv4(), crn, 'CRN')
    it('should request previous and upcoming appointments from the api', () => {
      expect(getPersonScheduleSpy).toHaveBeenCalledWith(crn, 'upcoming', '0', '&sortBy=date&ascending=true')
    })
    it('should request risks from the api', () => {
      expect(getRisksSpy).toHaveBeenCalledWith(crn)
    })
    it('should request tier calculation details from the api', () => {
      expect(getCalculationDetailsSpy).toHaveBeenCalledWith(crn)
    })
    it('should request predictors from the api', () => {
      expect(getPredictorsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the appointments page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/upcoming-appointments', {
        upcomingAppointments: mockPersonSchedule,
        crn,
        tierCalculation: mockTierCalculation,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
        sortedBy: 'date.asc',
        pagination: {
          from: '1',
          items: [],
          next: undefined,
          prev: undefined,
          to: '0',
          total: '0',
        },
      })
    })
  })

  describe('post appointments', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('CRN request parameter is valid', () => {
      beforeEach(() => {
        mockIsValidCrn.mockReturnValue(true)
        controllers.appointments.postAppointments(hmppsAuthClient)(req, res)
      })

      it('should redirect to the arrange appointment type page', () => {
        expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/type`)
      })
    })
    describe('CRN request parameter is invalid', () => {
      beforeEach(() => {
        mockIsValidCrn.mockReturnValue(false)
        controllers.appointments.postAppointments(hmppsAuthClient)(req, res)
      })
      it('should return a 404 status and render the error page', () => {
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
      })
    })
  })
  describe('appointment details', () => {
    beforeEach(async () => {
      await controllers.appointments.getAppointmentDetails(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_PERSONAL_DETAILS', uuidv4(), crn, 'CRN')
    it('should request the person appointment from the api', () => {
      expect(getPersonAppointmentSpy).toHaveBeenCalledWith(crn, contactId)
    })
    it('should render the appointment detail page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/appointment', {
        personAppointment: mockPersonAppointment,
        crn,
      })
    })
  })

  describe('get record an outcome', () => {
    beforeEach(async () => {
      await controllers.appointments.getRecordAnOutcome(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_PERSONAL_DETAILS', uuidv4(), crn, 'CRN')
    it('should request previous appointments from the api', () => {
      expect(getPersonScheduleSpy).toHaveBeenCalledWith(crn, 'previous', '0')
    })
    it('should render the record an outcome page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/record-an-outcome', {
        schedule: mockPersonSchedule,
        crn,
        actionType,
      })
    })
  })

  describe('post record an outcome', () => {
    describe('If appointment id is null in request body', () => {
      beforeEach(async () => {
        const mockReq = httpMocks.createRequest({
          params: {
            crn,
            id,
            contactId,
            actionType,
          },
          query: { page: '', view: 'default', category: 'mock-category' },
          body: {
            'appointment-id': null,
          },
        })
        await controllers.appointments.postRecordAnOutcome(hmppsAuthClient)(mockReq, res)
      })
      it('should log appointment has not been selected', () => {
        expect(loggerSpy).toHaveBeenCalledWith('Appointment not selected')
      })
      it('should request previous appointments from the api', () => {
        expect(getPersonScheduleSpy).toHaveBeenCalledWith(crn, 'previous', '0')
      })
      it('should render the record an outcome page', () => {
        expect(renderSpy).toHaveBeenCalledWith('pages/appointments/record-an-outcome', {
          errorMessages: {
            appointment: { text: 'Please select an appointment' },
          },
          schedule: mockPersonSchedule,
          crn,
          actionType,
        })
      })
    })
    describe('If appointment id in request body', () => {
      const appointmentId = '1234'
      beforeEach(async () => {
        mockIsValidCrn.mockReturnValue(true)
        mockIsNumericString.mockReturnValue(true)
        const mockReq = httpMocks.createRequest({
          params: {
            crn,
            id,
            contactId,
            actionType,
          },
          query: { page: '', view: 'default', category: 'mock-category' },
          body: {
            'appointment-id': appointmentId,
          },
        })
        await controllers.appointments.postRecordAnOutcome(hmppsAuthClient)(mockReq, res)
      })
      it('should redirect to the appointment details page', () => {
        expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${appointmentId}`)
      })
    })
    describe('If CRN request param is invalid', () => {
      const appointmentId = '1234'
      const mockReq = httpMocks.createRequest({
        params: {
          crn,
          id,
          contactId,
          actionType,
        },
        query: { page: '', view: 'default', category: 'mock-category' },
        body: {
          'appointment-id': appointmentId,
        },
      })
      beforeEach(async () => {
        mockIsValidCrn.mockReturnValue(false)
        mockIsNumericString.mockReturnValue(false)

        await controllers.appointments.postRecordAnOutcome(hmppsAuthClient)(mockReq, res)
      })
      it('should return a 404 status and render the error page', () => {
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      })
      it('should not redirect', () => {
        expect(redirectSpy).not.toHaveBeenCalled()
      })
    })
  })
})
