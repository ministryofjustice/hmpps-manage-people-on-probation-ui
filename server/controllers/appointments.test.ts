import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import { Request } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ParsedQs } from 'qs'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import { isValidCrn, isNumericString, setDataValue, canRescheduleAppointment, isMatchingAddress } from '../utils'
import { mockAppResponse, mockPersonSchedule, mockPersonAppointment } from './mocks'
import { checkAuditMessage, checkSendAuditMessage } from './testutils'
import { cloneAppointmentAndRedirect, renderError } from '../middleware'
import { AppointmentSession, NextAppointmentResponse, AttendedCompliedAppointment } from '../models/Appointments'
import { Activity, PersonAppointment } from '../data/model/schedule'
import { isSuccessfulUpload } from './appointments'
import { ProbationPractitioner } from '../models/CaseDetail'
import { SubjectType } from '../middleware/sendAuditMessage'

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
jest.mock('../data/eSupervisionClient')

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
    canRescheduleAppointment: jest.fn(),
  }
})
const mockMiddlewareFn = jest.fn()
jest.mock('../middleware', () => ({
  cloneAppointmentAndRedirect: jest.fn(() => mockMiddlewareFn),
  renderError: jest.fn(() => mockMiddlewareFn),
  getCheckinOffenderDetails: jest.fn(() => mockMiddlewareFn),
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
const mockCanRescheduleAppointment = canRescheduleAppointment as jest.MockedFunction<typeof canRescheduleAppointment>
const mockIsMatchingAddress = isMatchingAddress as jest.MockedFunction<typeof isMatchingAddress>

const reqObject = {
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
}
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

const mockPractitioner: ProbationPractitioner = {
  code: '',
  name: { forename: '', surname: '' },
  provider: { code: '', name: '' },
  team: { code: '', description: '' },
  unallocated: false,
  username: '',
}

const mockAppointment: AttendedCompliedAppointment | Activity = {
  type: '3 Way Meeting (NS)',
  officer: {
    name: {
      forename: 'Forename',
      surname: 'Surname',
    },
  },
  startDateTime: '2025-11-20',
}

const res = mockAppResponse({
  user: {
    username: 'user-1',
  },
  case: {
    mainAddress: {},
  },
  appointmentOutcome: {
    forename: 'Forename',
    surname: 'Surname',
    appointment: mockAppointment,
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

let getRelatedContactsSpy: jest.SpiedFunction<MasApiClient['getRelatedContacts']>

const patchAppointmentSpy = jest
  .spyOn(MasApiClient.prototype, 'patchAppointment')
  .mockImplementation(() => Promise.resolve(mockPersonAppointment))

const getProbationPractitionerSpy = jest
  .spyOn(MasApiClient.prototype, 'getProbationPractitioner')
  .mockImplementation(() => Promise.resolve(mockPractitioner))

describe('controllers/appointments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(MasApiClient.prototype, 'patchDocuments').mockResolvedValue({
      statusCode: 200,
    })
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

    it('should render the appointments page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments', {
        upcomingAppointments: mockPersonSchedule,
        pastAppointments: mockPersonSchedule,
        crn,
        personRisks: undefined,
        hasDeceased: false,
        hasPractitioner: true,
        canAccessCheckins: false,
        url: '',
      })
    })
  })
  describe('get appointments - no practitioner', () => {
    beforeEach(async () => {
      getProbationPractitionerSpy.mockImplementationOnce(() => Promise.resolve(undefined))
      await controllers.appointments.getAppointments(hmppsAuthClient)(req, res)
    })

    it('should render the appointments page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments', {
        upcomingAppointments: mockPersonSchedule,
        pastAppointments: mockPersonSchedule,
        crn,
        hasDeceased: false,
        hasPractitioner: false,
        canAccessCheckins: false,
        url: '',
      })
    })
  })
  describe('get appointments - checkins flag enabled and practitioner allocated', () => {
    beforeEach(async () => {
      res.locals.flags = { enableESupervisionCheckins: true }
      await controllers.appointments.getAppointments(hmppsAuthClient)(req, res)
    })
    afterEach(() => {
      res.locals.flags = undefined
    })

    it('should render the appointments page with canAccessCheckins true', () => {
      expect(renderSpy).toHaveBeenCalledWith(
        'pages/appointments',
        expect.objectContaining({
          hasPractitioner: true,
          canAccessCheckins: true,
        }),
      )
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
    it('should render the appointments page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/upcoming-appointments', {
        upcomingAppointments: mockPersonSchedule,
        crn,
        url: '',
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
    const mockRelatedContacts = [
      {
        contactId: 2510615347,
        contactTypeDescription: 'Breach Action - Breach Letter Sent',
        contactDate: '2026-05-12',
        createdBy: {
          forename: 'James',
          surname: 'Frost',
        },
      },
    ]
    beforeEach(async () => {
      mockCanRescheduleAppointment.mockReturnValueOnce(true)
      jest.spyOn(MasApiClient.prototype, 'getRelatedContacts').mockResolvedValue(mockRelatedContacts)
      await controllers.appointments.getManageAppointment(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MANAGE_APPOINTMENT', uuidv4(), crn, 'CRN')
    it('should request the person appointment', () => {
      expect(getPersonAppointmentSpy).toHaveBeenCalledWith(crn, id)
    })
    it('should request the next appointment', () => {
      expect(getNextAppointmentSpy).toHaveBeenCalledWith('user-1', crn, id)
    })
    it('should request related contacts', () => {
      expect(MasApiClient.prototype.getRelatedContacts).toHaveBeenCalledWith(crn, id)
    })
    it('should render the manage appointment page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/manage-appointment', {
        personAppointment: mockPersonAppointment,
        crn,
        back: undefined,
        nextAppointment: nextApptResponse(),
        hasDeceased: false,
        url: '',
        canReschedule: true,
        contactId: '1234',
        relatedContacts: mockRelatedContacts,
      })
    })

    it('should not set a location for a telephone appointment', async () => {
      getNextAppointmentSpy.mockResolvedValueOnce(
        nextApptResponse({
          type: 'Planned Telephone Contact (NS)',
          location: {},
        } as Activity),
      )

      await controllers.appointments.getManageAppointment(hmppsAuthClient)(req, res)

      expect(res.locals.nextAppointmentLocation).toBeNull()
    })
  })

  describe('get record an outcome', () => {
    beforeEach(() => {
      res.locals.flags = { enableOutcomesV1: true }
    })
    it('should render the record an outcome page', async () => {
      await controllers.appointments.getRecordAnOutcome(hmppsAuthClient)(req, res)
      checkSendAuditMessage(res, 'VIEW_RECORD_AN_OUTCOME', crn, 'CRN' as SubjectType)
      const outcomeActionType = 'outcome'
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/record-an-outcome', {
        crn,
        actionType: outcomeActionType,
        contactId,
        baseUrl: '',
        outcomesFilter: 'PAST_TWO_YEARS',
      })
    })
    it('should filter outcomes when filter is set', async () => {
      const reqWithFilter = httpMocks.createRequest({
        ...reqObject,
        query: { ...reqObject.query, filter: 'true' },
        body: { outcomesFilter: 'OLDER_THAN_TWO_YEARS', 'appointment-id': id },
      })
      await controllers.appointments.getRecordAnOutcome(hmppsAuthClient)(reqWithFilter, res)
      checkSendAuditMessage(res, 'VIEW_RECORD_AN_OUTCOME', crn, 'CRN' as SubjectType)
      const outcomeActionType = 'outcome'
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/record-an-outcome', {
        crn,
        actionType: outcomeActionType,
        contactId,
        baseUrl: '',
        outcomesFilter: 'OLDER_THAN_TWO_YEARS',
      })
    })
    it('should redirect when filter is not set', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsNumericString.mockReturnValue(true)
      const reqWithoutFilter = httpMocks.createRequest({
        ...reqObject,
        query: { ...reqObject.query, filter: 'false' },
        body: { outcomesFilter: 'ALL', 'appointment-id': id },
      })
      await controllers.appointments.getRecordAnOutcome(hmppsAuthClient)(reqWithoutFilter, res)
      const outcomeActionType = 'outcome'
      expect(redirectSpy).toHaveBeenCalledWith(
        `/case/${crn}/appointments/appointment/${id}/manage?back=/case/${crn}/record-an-outcome/${outcomeActionType}`,
      )
    })
    it('should redirect to error when invalid crn', async () => {
      mockIsValidCrn.mockReturnValue(false)
      mockIsNumericString.mockReturnValue(true)
      const reqWithoutFilter = httpMocks.createRequest({
        ...reqObject,
        query: { ...reqObject.query, filter: 'false' },
        body: { outcomesFilter: 'ALL', 'appointment-id': id },
      })
      await controllers.appointments.getRecordAnOutcome(hmppsAuthClient)(reqWithoutFilter, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
    })
    it('should redirect to error when invalid appointment id', async () => {
      mockIsValidCrn.mockReturnValue(true)
      mockIsNumericString.mockReturnValue(false)
      const reqWithoutFilter = httpMocks.createRequest({
        ...reqObject,
        query: { ...reqObject.query, filter: 'false' },
        body: { outcomesFilter: 'ALL', 'appointment-id': id },
      })
      await controllers.appointments.getRecordAnOutcome(hmppsAuthClient)(reqWithoutFilter, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
    })
  })

  /* Delete these tests after enableNonCompliance feature flag is removed 👇 */

  describe('get attended and complied', () => {
    beforeEach(async () => {
      await controllers.appointments.getAttendedComplied(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_RECORD_AN_OUTCOME', uuidv4(), crn, 'CRN')
    it('should render the record an outcome page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/attended-complied', {
        crn,
        alertDismissed: false,
        isInPast: true,
        headerPersonName: { forename: 'Forename', surname: 'Surname' },
        forename: 'Forename',
        surname: 'Surname',
        appointment: mockAppointment,
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

  /* ----------------- 👆 -----------------  */

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
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/add-note', {
        body: null,
        crn,
        errorMessages: null,
        url: '',
        maxCharCount: 12000,
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
        let mockReq: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
        beforeEach(async () => {
          mockIsValidCrn.mockReturnValue(true)
          mockIsNumericString.mockReturnValue(true)

          // mock successful file upload
          jest.spyOn(MasApiClient.prototype, 'patchDocuments').mockResolvedValue({
            statusCode: 200,
          })

          mockReq = httpMocks.createRequest({
            body: {
              notes: 'some mock notes',
              sensitivity: 'Yes',
            },
            params: {
              contactId: id,
              crn,
            },
            session: {
              data: {},
            },
          })

          await controllers.appointments.postAddNote(hmppsAuthClient)(mockReq, res)
        })
        it('should send the patch request to the api', () => {
          expect(patchAppointmentSpy).toHaveBeenCalledWith({
            id: parseInt(mockReq.params.contactId as string, 10),
            notes: mockReq.body.notes,
            sensitive: true,
            outcomeRecorded: false,
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

          jest.spyOn(MasApiClient.prototype, 'patchDocuments').mockResolvedValue({
            statusCode: 200,
          })

          mockReq = httpMocks.createRequest({
            body: {
              notes: 'some mock notes',
              sensitivity: 'No',
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
                      outcomeRecorded: 'Yes',
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
            id: parseInt(mockReq.params.contactId as string, 10),
            notes: mockReq.body.notes,
            sensitive: false,
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
        id: contactId,
        outcomeJourney: false,
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
        session: {
          data: {
            appointments: {
              [crn]: {
                [contactId]: { eventId: '2' },
              },
            },
          },
        },
      })
      const mockRes = mockAppResponse({
        appointmentSession: {} as AppointmentSession,
      })
      controllers.appointments.postNextAppointment(hmppsAuthClient)(mockReq, mockRes)
      expect(mockCloneAppointmentAndRedirect).toHaveBeenCalledWith({ eventId: '2' }, 'KEEP_TYPE')
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
        session: {
          data: {},
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
        session: {
          data: {},
        },
      })
      await controllers.appointments.postNextAppointment(hmppsAuthClient)(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${contactId}/manage/`)
    })
  })

  describe('get appointment note', () => {
    beforeEach(async () => {
      getPersonAppointmentNoteSpy.mockResolvedValue({
        personSummary: {
          crn,
          dateOfBirth: '1979-08-18',
          name: { forename: 'Eula', surname: 'Schmeler' },
        },
        documents: [],
        appointment: {
          id: contactId,
          type: 'Phone call',
          startDateTime: '2026-06-30T10:00:00Z',
          appointmentNote: {
            id: Number(noteId),
            note: 'This is the full, untruncated note text',
            hasNoteBeenTruncated: false,
            createdBy: 'Test User',
            createdByDate: '2026-06-30T10:00:00Z',
          },
        },
      } as PersonAppointment)

      getPersonAppointmentSpy.mockResolvedValue({
        ...mockPersonAppointment,
        appointment: {
          ...mockPersonAppointment.appointment,
          appointmentNotes: [
            {
              id: Number(noteId),
              note: 'This is the truncated note...',
              hasNoteBeenTruncated: true,
              createdBy: 'Test User',
              createdByDate: '2026-06-30T10:00:00Z',
            },
            {
              id: 999,
              note: 'Another note remains unchanged',
              hasNoteBeenTruncated: false,
              createdBy: 'Another User',
              createdByDate: '2026-06-30T11:00:00Z',
            },
          ],
        },
      })

      await controllers.appointments.getAppointmentNote(hmppsAuthClient)(req, res)
    })

    checkAuditMessage(res, 'VIEW_MAS_APPOINTMENT_NOTE', uuidv4(), crn, 'CRN')

    it('should render the appointment page with merged notes (selected note full, others unchanged)', () => {
      expect(getPersonAppointmentNoteSpy).toHaveBeenCalledWith(crn, id, noteId)
      expect(getPersonAppointmentSpy).toHaveBeenCalledWith(crn, id)
      expect(renderSpy).toHaveBeenCalledWith(
        'pages/appointments/appointment',
        expect.objectContaining({
          crn,
          contactId,
          back: undefined,
          personAppointment: expect.objectContaining({
            appointment: expect.objectContaining({
              appointmentNotes: expect.arrayContaining([
                expect.objectContaining({
                  id: Number(noteId),
                  note: 'This is the full, untruncated note text',
                  hasNoteBeenTruncated: false,
                }),
                expect.objectContaining({
                  id: 999,
                  note: 'Another note remains unchanged',
                  hasNoteBeenTruncated: false,
                }),
              ]),
            }),
          }),
        }),
      )
    })
  })

  it('treats null patchDocuments response as success', async () => {
    mockIsValidCrn.mockReturnValue(true)
    mockIsNumericString.mockReturnValue(true)

    jest.spyOn(MasApiClient.prototype, 'patchDocuments').mockResolvedValue(null)

    const mockReq = httpMocks.createRequest({
      body: {
        notes: 'some mock notes',
        sensitivity: 'Yes',
      },
      params: {
        contactId: id,
        crn,
      },
      file: {
        originalname: 'test.pdf',
      } as Express.Multer.File,
      session: {
        data: {},
      },
    })

    await controllers.appointments.postAddNote(hmppsAuthClient)(mockReq, res)

    expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${id}/manage`)
  })
  it('renders error page when file upload fails', async () => {
    mockIsValidCrn.mockReturnValue(true)
    mockIsNumericString.mockReturnValue(true)

    jest.spyOn(MasApiClient.prototype, 'patchDocuments').mockResolvedValue({
      statusCode: 415,
      errors: [{ text: 'Upload failed' }],
    })

    const mockReq = httpMocks.createRequest({
      body: {
        notes: 'some mock notes',
        sensitivity: 'Yes',
      },
      params: {
        contactId: id,
        crn,
      },
      file: {
        originalname: 'test.pdf',
      } as Express.Multer.File,
      session: {
        data: {},
      },
    })

    await controllers.appointments.postAddNote(hmppsAuthClient)(mockReq, res)

    expect(renderSpy).toHaveBeenCalledWith('pages/appointments/add-note', {
      uploadError: 'File not uploaded. Please try again.',
      patchResponse: expect.any(Object),
      sensitive: true,
      notes: 'some mock notes',
    })

    expect(redirectSpy).not.toHaveBeenCalled()
  })
  it('does not call patchDocuments when no file is uploaded', async () => {
    mockIsValidCrn.mockReturnValue(true)
    mockIsNumericString.mockReturnValue(true)

    const patchDocumentsSpy = jest.spyOn(MasApiClient.prototype, 'patchDocuments')

    const mockReq = httpMocks.createRequest({
      body: {
        notes: 'some mock notes',
        sensitivity: 'Yes',
      },
      params: {
        contactId: id,
        crn,
      },
      session: {
        data: {},
      },
      // IMPORTANT: no req.file
    })

    await controllers.appointments.postAddNote(hmppsAuthClient)(mockReq, res)

    expect(patchDocumentsSpy).not.toHaveBeenCalled()
    expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${id}/manage`)
  })

  describe('isSuccessfulUpload', () => {
    it('returns true for null', () => {
      expect(isSuccessfulUpload(null)).toBe(true)
    })

    it('returns true for undefined', () => {
      expect(isSuccessfulUpload(undefined)).toBe(true)
    })

    it('returns true for primitive values', () => {
      expect(isSuccessfulUpload('string')).toBe(true)
      expect(isSuccessfulUpload(true)).toBe(true)
      expect(isSuccessfulUpload(123)).toBe(true)
    })

    it('returns true for 2xx statusCode', () => {
      expect(isSuccessfulUpload({ statusCode: 200 })).toBe(true)
      expect(isSuccessfulUpload({ statusCode: 204 })).toBe(true)
    })

    it('returns false for non-2xx statusCode', () => {
      expect(isSuccessfulUpload({ statusCode: 400 })).toBe(false)
      expect(isSuccessfulUpload({ statusCode: 415 })).toBe(false)
      expect(isSuccessfulUpload({ statusCode: 500 })).toBe(false)
    })

    it('returns false for explicit error shape', () => {
      expect(
        isSuccessfulUpload({
          errors: [{ text: 'Upload failed' }],
        }),
      ).toBe(false)
    })

    it('returns false when statusCode and errors are present', () => {
      expect(
        isSuccessfulUpload({
          statusCode: 415,
          errors: [{ text: 'Upload failed' }],
        }),
      ).toBe(false)
    })

    it('returns true for empty object', () => {
      expect(isSuccessfulUpload({})).toBe(true)
    })

    it('returns false for unknown object shape', () => {
      expect(isSuccessfulUpload({ foo: 'bar' })).toBe(false)
    })
  })
})
