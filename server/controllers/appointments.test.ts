import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import logger from '../../logger'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import { toRoshWidget, toPredictors, isValidCrn, isNumericString, setDataValue } from '../utils'
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

const crn = 'X000001'
const id = '1234'
const noteId = '1'
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
    setDataValue: jest.fn(),
  }
})
const mockMiddlewareFn = jest.fn()
jest.mock('../middleware', () => ({
  cloneAppointmentAndRedirect: jest.fn(() => mockMiddlewareFn),
  renderError: jest.fn(() => mockMiddlewareFn),
}))

jest.mock('./arrangeAppointment', () => ({
  redirectToSentence: jest.fn(() => mockMiddlewareFn),
  getSentence: jest.fn(() => mockMiddlewareFn),
}))

const mockRenderError = renderError as jest.MockedFunction<typeof renderError>

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const mockIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>
const mockIsNumericString = isNumericString as jest.MockedFunction<typeof isNumericString>
const mockCloneAppointmentAndRedirect = cloneAppointmentAndRedirect as jest.MockedFunction<
  typeof cloneAppointmentAndRedirect
>
const mockSetDataValue = setDataValue as jest.MockedFunction<typeof setDataValue>
const req = httpMocks.createRequest({
  params: {
    crn,
    id,
    noteId,
    contactId,
    actionType,
  },
  url: '',
  query: { page: '', view: 'default', category: 'mock-category', contactId },
  session: {
    data: {},
  },
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

const getPersonAppointmentNoteSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonAppointmentNote')
  .mockImplementation(() => Promise.resolve(mockPersonAppointment))
const loggerSpy = jest.spyOn(logger, 'info')

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
        personRisks: undefined,
        url: '',
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
        url: '',
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
        expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/sentence?back=${req.url}`)
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
        back: undefined,
        nextAppointment: nextApptResponse(),
        nextAppointmentIsAtHome: true,
        queryParams: ['view=default'],
        url: '',
        canReschedule: true,
        contactId: '1234',
      })
    })

    describe('canReschedule logic', () => {
      it('should be false when didTheyComply is true', async () => {
        const compliantAppointment = {
          ...mockPersonAppointment,
          appointment: {
            ...mockPersonAppointment.appointment,
            didTheyComply: true,
            isInPast: true,
          },
        }
        getPersonAppointmentSpy.mockResolvedValueOnce(compliantAppointment as any)
        const localRes = mockAppResponse({
          user: { username: 'user-1' },
          case: { mainAddress: {} },
        })
        const localRender = jest.spyOn(localRes, 'render')
        await controllers.appointments.getManageAppointment(hmppsAuthClient)(req, localRes)
        expect(localRender).toHaveBeenCalledWith(
          'pages/appointments/manage-appointment',
          expect.objectContaining({ canReschedule: false }),
        )
      })

      it('should be true when not complied and appointment is in the past', async () => {
        const pastAppointment = {
          ...mockPersonAppointment,
          appointment: {
            ...mockPersonAppointment.appointment,
            didTheyComply: false,
            isInPast: true,
            startDateTime: '2020-01-01T10:00:00.000Z',
          },
        }
        getPersonAppointmentSpy.mockResolvedValueOnce(pastAppointment as any)
        const localRes = mockAppResponse({
          user: { username: 'user-1' },
          case: { mainAddress: {} },
        })
        const localRender = jest.spyOn(localRes, 'render')
        await controllers.appointments.getManageAppointment(hmppsAuthClient)(req, localRes)
        expect(localRender).toHaveBeenCalledWith(
          'pages/appointments/manage-appointment',
          expect.objectContaining({ canReschedule: true }),
        )
      })

      it('should be true when not complied and appointment is in the future', async () => {
        const futureAppointment = {
          ...mockPersonAppointment,
          appointment: {
            ...mockPersonAppointment.appointment,
            didTheyComply: false,
            isInPast: false,
            startDateTime: '2999-01-01T10:00:00.000Z',
          },
        }
        getPersonAppointmentSpy.mockResolvedValueOnce(futureAppointment as any)
        const localRes = mockAppResponse({
          user: { username: 'user-1' },
          case: { mainAddress: {} },
        })
        const localRender = jest.spyOn(localRes, 'render')
        await controllers.appointments.getManageAppointment(hmppsAuthClient)(req, localRes)
        expect(localRender).toHaveBeenCalledWith(
          'pages/appointments/manage-appointment',
          expect.objectContaining({ canReschedule: true }),
        )
      })

      it('should be false when appointment details are missing', async () => {
        const missingAppointment: any = {}
        getPersonAppointmentSpy.mockResolvedValueOnce(missingAppointment)
        const localRes = mockAppResponse({
          user: { username: 'user-1' },
          case: { mainAddress: {} },
        })
        const localRender = jest.spyOn(localRes, 'render')
        await controllers.appointments.getManageAppointment(hmppsAuthClient)(req, localRes)
        expect(localRender).toHaveBeenCalledWith(
          'pages/appointments/manage-appointment',
          expect.objectContaining({ canReschedule: false }),
        )
      })
    })
  })

  describe('get record an outcome', () => {
    beforeEach(async () => {
      await controllers.appointments.getRecordAnOutcome(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_RECORD_AN_OUTCOME', uuidv4(), crn, 'CRN')
    it('should render the record an outcome page', () => {
      const outcomeActionType = 'outcome'
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/record-an-outcome', {
        crn,
        actionType: outcomeActionType,
        contactId,
      })
    })
  })

  describe('post record an outcome', () => {
    describe('CRN request parameter is invalid', () => {
      beforeEach(() => {
        mockIsValidCrn.mockReturnValue(false)
        mockIsNumericString.mockReturnValue(true)
        controllers.appointments.postRecordAnOutcome(hmppsAuthClient)(req, res)
      })
      it('should return a 404 status and render the error page', () => {
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
      })
    })
    describe('appointment id is invalid', () => {
      beforeEach(() => {
        mockIsValidCrn.mockReturnValue(true)
        mockIsNumericString.mockReturnValue(false)
        controllers.appointments.postRecordAnOutcome(hmppsAuthClient)(req, res)
      })
      it('should return a 404 status and render the error page', () => {
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
      })
    })
    describe('If appointment is selected', () => {
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
            'appointment-id': contactId,
          },
        })
        await controllers.appointments.postRecordAnOutcome(hmppsAuthClient)(mockReq, res)
      })
      it('should redirect to the manage appointment page', () => {
        expect(redirectSpy).toHaveBeenCalledWith(
          `/case/${crn}/appointments/appointment/${contactId}/manage?back=/case/${crn}/record-an-outcome/${actionType}?contactId=${contactId}`,
        )
      })
    })
  })

  describe('get attended and complied', () => {
    beforeEach(async () => {
      await controllers.appointments.getAttendedComplied(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_RECORD_AN_OUTCOME', uuidv4(), crn, 'CRN')
    it('should render the record an outcome page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/attended-complied', {
        crn,
      })
    })
  })

  describe('post attended and complied', () => {
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
      session: {
        data: {},
      },
    })
    describe('If CRN request param is invalid', () => {
      beforeEach(async () => {
        mockIsValidCrn.mockReturnValue(false)
        mockIsNumericString.mockReturnValue(false)
        await controllers.appointments.postAttendedComplied(hmppsAuthClient)(mockReq, res)
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
        await controllers.appointments.postAttendedComplied(hmppsAuthClient)(mockReq, res)
      })
      it('should set the outcome recorded session', () => {
        expect(mockSetDataValue).toHaveBeenCalledWith(
          req.session.data,
          ['appointments', crn, contactId, 'outcomeRecorded'],
          true,
        )
      })
      it('should redirect to the add notes page', () => {
        expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${id}/add-note`)
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
        body: {
          fieldName: 'value',
        },
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
    it('should delete body session value if it exists', () => {
      expect(mockReq.session.body).toBeUndefined()
    })
    it('should render the add note page', () => {
      const { fileUploadLimit, maxFileSize, validMimeTypes } = config
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/add-note', {
        body: null,
        crn,
        errorMessages: null,
        uploadedFiles: [],
        fileUploadLimit,
        maxFileSize,
        url: '',
        maxCharCount: 4000,
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
      describe('click thru from manage appointment page', () => {
        const mockReq = httpMocks.createRequest({
          body: {
            notes: 'some mock notes',
            sensitive: 'Yes',
          },
          params: {
            contactId: id,
            crn,
          },
          session: {
            data: {},
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
      describe('redirect from attended and complied page', () => {
        let mockReq: httpMocks.MockRequest<any>
        beforeEach(async () => {
          mockIsValidCrn.mockReturnValue(true)
          mockIsNumericString.mockReturnValue(true)
          mockReq = httpMocks.createRequest({
            body: {
              notes: 'some mock notes',
              sensitive: 'Yes',
            },
            params: {
              contactId: id,
              crn,
            },
            session: {
              data: {
                appointments: {
                  [crn]: {
                    [contactId]: {
                      outcomeRecorded: true,
                    },
                  },
                },
              },
            },
          })
          await controllers.appointments.postAddNote(hmppsAuthClient)(mockReq, res)
        })
        it('should delete the outcome recorded session value', () => {
          expect(mockReq.session.data.appointments[crn][id].outcomeRecorded).toBeUndefined()
        })
        it('should send the patch request to the api', () => {
          expect(patchAppointmentSpy).toHaveBeenCalledWith({
            id: parseInt(mockReq.params.contactId, 10),
            notes: mockReq.body.notes,
            sensitive: true,
            outcomeRecorded: true,
          })
        })
        it('should redirect to the manage appointment page', () => {
          expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${id}/manage`)
        })
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
      session: {
        data: {},
      },
    })
    describe('Audit message', () => {
      beforeEach(async () => {
        await controllers.appointments.getNextAppointment(hmppsAuthClient)(mockReq, res)
      })
      checkAuditMessage(res, 'VIEW_NEXT_APPOINTMENT', uuidv4(), crn, 'CRN')
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
      expect(mockCloneAppointmentAndRedirect).toHaveBeenCalledWith({})
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, mockRes)
    })

    it('should redirect to the sentence page if CHANGE_TYPE selected', () => {
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
  })

  describe('get appointment note', () => {
    beforeEach(async () => {
      await controllers.appointments.getAppointmentNote(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_APPOINTMENT_NOTE', uuidv4(), crn, 'CRN')
    it('should request the person appointment note', () => {
      expect(getPersonAppointmentNoteSpy).toHaveBeenCalledWith(crn, id, noteId)
    })
    it('should render the appointment notepage', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/appointment', {
        personAppointment: mockPersonAppointment,
        crn,
        contactId,
        back: undefined,
        queryParams: ['view=default'],
      })
    })
  })
})
