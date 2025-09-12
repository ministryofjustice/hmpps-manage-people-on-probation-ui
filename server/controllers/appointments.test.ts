import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import { toRoshWidget, toPredictors, isValidCrn, isNumericString, isMatchingAddress } from '../utils'
import {
  mockTierCalculation,
  mockRisks,
  mockPredictors,
  mockAppResponse,
  mockPersonSchedule,
  mockPersonAppointment,
} from './mocks'
import { checkAuditMessage } from './testutils'
import { cloneAppointmentAndRedirect, renderError } from '../middleware'
import { AppointmentSession, NextAppointmentResponse } from '../models/Appointments'
import { Activity } from '../data/model/schedule'
import config from '../config'

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
    isMatchingAddress: jest.fn(() => true),
  }
})
const mockMiddlewareFn = jest.fn()
jest.mock('../middleware', () => ({
  cloneAppointmentAndRedirect: jest.fn(() => mockMiddlewareFn),
  renderError: jest.fn(() => mockMiddlewareFn),
}))

const mockRenderError = renderError as jest.MockedFunction<typeof renderError>

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const mockIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>
const mockIsNumericString = isNumericString as jest.MockedFunction<typeof isNumericString>
const mockCloneAppointmentAndRedirect = cloneAppointmentAndRedirect as jest.MockedFunction<
  typeof cloneAppointmentAndRedirect
>
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
  user: {
    username: 'user-1',
  },
  case: {
    mainAddress: {},
  },
})

const renderSpy = jest.spyOn(res, 'render')
const redirectSpy = jest.spyOn(res, 'redirect')

const getPersonScheduleSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonSchedule')
  .mockImplementation(() => Promise.resolve(mockPersonSchedule))

const getPersonAppointmentSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonAppointment')
  .mockImplementation(() => Promise.resolve(mockPersonAppointment))

const nextApptResponse = (appointment = {} as Activity | null): NextAppointmentResponse => ({
  appointment,
  usernameIsCom: true,
  personManager: {
    code: '',
    name: {
      forename: 'Joe',
      surname: 'Bloggs',
    },
  },
})
const getNextAppointmentSpy = jest
  .spyOn(MasApiClient.prototype, 'getNextAppointment')
  .mockImplementation(() => Promise.resolve(nextApptResponse()))

const patchAppointmentSpy = jest
  .spyOn(MasApiClient.prototype, 'patchAppointment')
  .mockImplementation(() => Promise.resolve(mockPersonAppointment))

const getCalculationDetailsSpy = jest
  .spyOn(TierApiClient.prototype, 'getCalculationDetails')
  .mockImplementation(() => Promise.resolve(mockTierCalculation))

const getRisksSpy = jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockImplementation(() => Promise.resolve(mockRisks))
const getPredictorsSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getPredictorsAll')
  .mockImplementation(() => Promise.resolve(mockPredictors))

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

      it('should redirect to the arrange appointment sentence page', () => {
        expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/sentence`)
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

  describe('get manage appointment', () => {
    beforeEach(async () => {
      await controllers.appointments.getManageAppointment(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MANAGE_APPOINTMENT', uuidv4(), crn, 'CRN')
    it('should request the person appointment', () => {
      expect(getPersonAppointmentSpy).toHaveBeenCalledWith(crn, id)
    })
    it('should request the next appointment', () => {
      expect(getNextAppointmentSpy).toHaveBeenCalledWith('user-1', crn, id)
    })
    it('should render the manage appointment page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/manage-appointment', {
        personAppointment: mockPersonAppointment,
        crn,
        nextAppointment: nextApptResponse(),
        nextAppointmentIsAtHome: true,
      })
    })
  })

  describe('get record an outcome', () => {
    beforeEach(async () => {
      await controllers.appointments.getRecordAnOutcome(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_RECORD_AN_OUTCOME', uuidv4(), crn, 'CRN')
    it('should render the record an outcome page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/record-an-outcome', {
        crn,
      })
    })
  })

  describe('post record an outcome', () => {
    const mockReq = httpMocks.createRequest({
      params: {
        crn,
        id,
        contactId,
        actionType,
      },
      body: {
        outcomeRecorded: 'yes',
      },
    })
    describe('If CRN request param is invalid', () => {
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
      it('should NOT send the patch request to the api', () => {
        expect(patchAppointmentSpy).not.toHaveBeenCalled()
      })
    })
    describe('If CRN request param is valid', () => {
      beforeEach(async () => {
        mockIsValidCrn.mockReturnValue(true)
        mockIsNumericString.mockReturnValue(true)
        await controllers.appointments.postRecordAnOutcome(hmppsAuthClient)(mockReq, res)
      })
      it('should send the patch request to the api', () => {
        expect(patchAppointmentSpy).toHaveBeenCalledWith({ id: parseInt(contactId, 10), outcomeRecorded: true })
      })
      it('should redirect to the manage appointment page', () => {
        expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${id}/manage`)
      })
    })
    describe('If CRN request param is valid', () => {
      beforeEach(async () => {
        mockIsValidCrn.mockReturnValue(true)
        mockIsNumericString.mockReturnValue(true)
        await controllers.appointments.postRecordAnOutcome(hmppsAuthClient)(mockReq, res)
      })
      it('should send the patch request to the api', () => {
        expect(patchAppointmentSpy).toHaveBeenCalledWith({ id: parseInt(contactId, 10), outcomeRecorded: true })
      })
      it('should redirect to the manage appointment page', () => {
        expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${id}/manage`)
      })
    })
  })
  describe('get add note', () => {
    const uploadedFiles = [{ filename: 'mock-file.pdf' }] as Express.Multer.File[]
    const errorMessages = {
      notes: 'Notes error',
      sensitivity: 'Sensitivity error',
    }
    const mockReq = httpMocks.createRequest({
      params: {
        crn,
        id,
        contactId,
        actionType,
      },
      session: {
        cache: {
          uploadedFiles,
        },
        errorMessages,
      },
    })
    beforeEach(async () => {
      await controllers.appointments.getAddNote(hmppsAuthClient)(mockReq, res)
    })
    checkAuditMessage(res, 'ADD_APPOINTMENT_NOTES', uuidv4(), crn, 'CRN')
    it('should delete uploadedFiles session value if it exists', () => {
      expect(mockReq.session.cache.uploadedFiles).toBeUndefined()
    })
    it('should delete errorMessages session value if it exists', () => {
      expect(mockReq.session.errorMessages).toBeUndefined()
    })
    it('should render the add note page', () => {
      const { fileUploadLimit, maxFileSize, validMimeTypes } = config
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/add-note', {
        crn,
        errorMessages: null,
        uploadedFiles: [],
        fileUploadLimit,
        maxFileSize,
        validMimeTypes: Object.entries(validMimeTypes).map(([kMaxLength, v]) => v),
      })
    })
  })
  describe('post add note', () => {
    describe('If CRN request param is invalid', () => {
      beforeEach(async () => {
        mockIsValidCrn.mockReturnValue(false)
        mockIsNumericString.mockReturnValue(false)

        await controllers.appointments.postAddNote(hmppsAuthClient)(req, res)
      })
      it('should return a 404 status and render the error page', () => {
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
      })
      it('should not redirect', () => {
        expect(redirectSpy).not.toHaveBeenCalled()
      })
    })
    describe('If CRN request param is valid', () => {
      const mockReq = httpMocks.createRequest({
        body: {
          notes: 'some mock notes',
          sensitive: 'Yes',
        },
        params: {
          contactId: id,
          crn,
        },
      })
      beforeEach(async () => {
        mockIsValidCrn.mockReturnValue(true)
        mockIsNumericString.mockReturnValue(true)
        await controllers.appointments.postAddNote(hmppsAuthClient)(mockReq, res)
      })
      it('should send the patch request to the api', () => {
        expect(patchAppointmentSpy).toHaveBeenCalledWith({
          id: parseInt(mockReq.params.contactId, 10),
          notes: mockReq.body.notes,
          sensitive: true,
        })
      })
      it('should redirect to the manage appointment page', () => {
        expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${id}/manage`)
      })
    })
  })
  describe('get next appointment', () => {
    const mockReq = httpMocks.createRequest({
      params: {
        crn,
        id,
        contactId,
      },
    })
    describe('Audit message', () => {
      beforeEach(async () => {
        await controllers.appointments.getNextAppointment(hmppsAuthClient)(mockReq, res)
      })
      checkAuditMessage(res, 'VIEW_NEXT_APPOINTMENT', uuidv4(), crn, 'CRN')
    })
    it('should redirect to the manage appointment page if next appointment is already arranged', async () => {
      const mockRes = mockAppResponse({ nextAppointment: nextApptResponse() })
      const spy = jest.spyOn(mockRes, 'redirect')
      await controllers.appointments.getNextAppointment(hmppsAuthClient)(mockReq, mockRes)
      expect(spy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${contactId}/manage`)
    })
    it('should request the person appointment', async () => {
      const mockRes = mockAppResponse({ nextAppointment: nextApptResponse(null) })
      await controllers.appointments.getNextAppointment(hmppsAuthClient)(mockReq, mockRes)
      expect(getPersonAppointmentSpy).toHaveBeenCalledWith(crn, contactId)
    })
    it('should render the next appointment page', async () => {
      const mockRes = mockAppResponse({ nextAppointment: nextApptResponse(null) })
      const spy = jest.spyOn(mockRes, 'render')
      await controllers.appointments.getNextAppointment(hmppsAuthClient)(mockReq, mockRes)
      expect(spy).toHaveBeenCalledWith('pages/appointments/next-appointment', {
        personAppointment: mockPersonAppointment,
        crn,
        contactId,
      })
    })
  })
  describe('post next appointment', () => {
    it('should return a 404 status and render the error page if crn and contactId is invalid', () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsNumericString.mockReturnValue(false)
      controllers.appointments.postAppointments(hmppsAuthClient)(req, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
    it('should redirect to the manage page if answer is NO', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsNumericString.mockReturnValue(true)
      const mockReq = httpMocks.createRequest({
        params: {
          crn,
          id,
          contactId,
        },
        body: {
          nextAppointment: 'NO',
        },
      })
      await controllers.appointments.postNextAppointment(hmppsAuthClient)(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${contactId}/manage/`)
    })
    it('should clone the appointment and redirect if KEEP_TYPE selected', () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsNumericString.mockReturnValue(true)
      const mockReq = httpMocks.createRequest({
        params: {
          crn,
          id,
          contactId,
        },
        body: {
          nextAppointment: 'KEEP_TYPE',
        },
      })
      const mockRes = mockAppResponse({
        nextAppointmentSession: {} as AppointmentSession,
      })
      controllers.appointments.postNextAppointment(hmppsAuthClient)(mockReq, mockRes)
      expect(mockCloneAppointmentAndRedirect).toHaveBeenCalledWith(
        {},
        {
          clearType: false,
        },
      )
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, mockRes)
    })
    it('should clone the appointment and redirect if CHANGE_TYPE selected', () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsNumericString.mockReturnValue(true)
      const mockReq = httpMocks.createRequest({
        params: {
          crn,
          id,
          contactId,
        },
        body: {
          nextAppointment: 'CHANGE_TYPE',
        },
      })
      const mockRes = mockAppResponse({
        nextAppointmentSession: {} as AppointmentSession,
      })
      controllers.appointments.postNextAppointment(hmppsAuthClient)(mockReq, mockRes)
      expect(mockCloneAppointmentAndRedirect).toHaveBeenCalledWith(mockRes.locals.nextAppointmentSession, {
        clearType: true,
      })
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, mockRes)
    })
  })
})
