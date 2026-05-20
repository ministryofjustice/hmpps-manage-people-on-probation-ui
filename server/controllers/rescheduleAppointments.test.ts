import httpMocks from 'node-mocks-http'
import { AppointmentSession } from '../models/Appointments'
import { mockAppResponse } from './mocks'
import { isValidCrn, isValidUUID } from '../utils'
import { appointmentDateIsInPast, cloneAppointmentAndRedirect, renderError } from '../middleware'
import rescheduleAppointmentController from './rescheduleAppointments'
import { SubjectType } from '../middleware/sendAuditMessage'
import { checkSendAuditMessage } from './testutils'

jest.mock('../data/masApiClient')
jest.mock('@ministryofjustice/hmpps-audit-client')

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'f1654ea3-0abb-46eb-860b-654a96edbe20'),
}))

jest.mock('../utils', () => ({
  isValidCrn: jest.fn(),
  isValidUUID: jest.fn(),
  getDataValue: jest.fn(),
}))

const mockMiddlewareFn = jest.fn()
jest.mock('../middleware', () => ({
  renderError: jest.fn(() => mockMiddlewareFn),
  appointmentDateIsInPast: jest.fn(),
  cloneAppointmentAndRedirect: jest.fn(() => mockMiddlewareFn),
}))

const mockRenderError = renderError as jest.MockedFunction<typeof renderError>
const mockedIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>
const mockedIsValidUUID = isValidUUID as jest.MockedFunction<typeof isValidUUID>
const mockedCloneAppointmentAndRedirect = cloneAppointmentAndRedirect as jest.MockedFunction<
  typeof cloneAppointmentAndRedirect
>
const mockedAppointmentDateIsInPast = appointmentDateIsInPast as jest.MockedFunction<typeof appointmentDateIsInPast>

const crn = 'X000001'
const contactId = '12345'
const id = 'f1654ea3-0abb-46eb-860b-654a96edbe20'

describe('rescheduleAppointmentController', () => {
  const res = mockAppResponse()
  const renderSpy = jest.spyOn(res, 'render')
  const redirectSpy = jest.spyOn(res, 'redirect')

  beforeEach(() => {
    jest.clearAllMocks()
    mockedIsValidCrn.mockReturnValue(true)
    mockedIsValidUUID.mockReturnValue(true)
  })

  describe('redirectToRescheduleAppointment', () => {
    it('should redirect to reschedule appointment with a new UUID', async () => {
      const req = httpMocks.createRequest({
        params: { crn, contactId },
      })

      await rescheduleAppointmentController.redirectToRescheduleAppointment()(req, res, null)

      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/reschedule/${contactId}/${id}`)
    })

    it('should render 404 error if CRN is invalid', async () => {
      mockedIsValidCrn.mockReturnValue(false)
      const req = httpMocks.createRequest({
        params: { crn, contactId },
      })

      await rescheduleAppointmentController.redirectToRescheduleAppointment()(req, res, null)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('getRescheduleAppointment', () => {
    it('should render the reschedule appointment page', async () => {
      const req = httpMocks.createRequest({
        params: { crn, id, contactId },
        query: {},
        session: {},
      })

      await rescheduleAppointmentController.getRescheduleAppointment(null)(req, res, null)

      expect(renderSpy).toHaveBeenCalledWith(
        'pages/reschedule/appointment',
        expect.objectContaining({
          crn,
          contactId,
          id,
          showValidation: false,
        }),
      )
      checkSendAuditMessage(res, 'ADD_MAS_RESCHEDULE_APPOINTMENT', crn, SubjectType.CRN)
    })

    it('should handle session data and validation', async () => {
      const uploadedFiles = [{ fieldname: 'file', originalname: 'test.pdf' }]
      const errorMessages = { field: 'error' }
      const body = { some: 'data' }
      const req = httpMocks.createRequest({
        params: { crn, id, contactId },
        query: { validation: 'true' },
        session: {
          cache: { uploadedFiles },
          errorMessages,
          body,
        },
      })

      await rescheduleAppointmentController.getRescheduleAppointment(null)(req, res, null)

      expect(renderSpy).toHaveBeenCalledWith(
        'pages/reschedule/appointment',
        expect.objectContaining({
          uploadedFiles,
          errorMessages,
          body,
          showValidation: true,
        }),
      )
      expect(req.session.cache.uploadedFiles).toBeUndefined()
      expect(req.session.errorMessages).toBeUndefined()
      expect(req.session.body).toBeUndefined()
    })
  })

  describe('postRescheduleAppointment', () => {
    it('should call cloneAppointmentAndRedirect', async () => {
      const appointmentSession: AppointmentSession = {
        type: 'some-type',
      }
      const req = httpMocks.createRequest({
        params: { crn, id },
      })
      res.locals.appointmentSession = appointmentSession

      await rescheduleAppointmentController.postRescheduleAppointment(null)(req, res, null)

      expect(mockedCloneAppointmentAndRedirect).toHaveBeenCalledWith(appointmentSession, 'RESCHEDULE')
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })

    it('should render 404 if CRN or ID is invalid', async () => {
      mockedIsValidCrn.mockReturnValue(false)
      const req = httpMocks.createRequest({
        params: { crn, id },
      })

      await rescheduleAppointmentController.postRescheduleAppointment(null)(req, res, null)

      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    })
  })

  describe('getRescheduleCheckYourAnswer', () => {
    it('should render the check your answers page', async () => {
      mockedAppointmentDateIsInPast.mockReturnValue(true)
      const req = httpMocks.createRequest({
        params: { crn, id, contactId },
        url: '/some-url',
        session: {
          data: {
            appointments: {
              [crn]: {
                [id]: {
                  sensitivityLocked: false,
                },
              },
            },
          },
        },
      })

      await rescheduleAppointmentController.getRescheduleCheckYourAnswer(null)(req, res, null)

      expect(renderSpy).toHaveBeenCalledWith('pages/reschedule/check-your-answers', {
        crn,
        id,
        contactId,
        url: '/some-url',
        isInPast: true,
      })
      checkSendAuditMessage(res, 'VIEW_MAS_CHANGE_APPOINTMENT_DETAILS_AND_RESCHEDULE', crn, SubjectType.CRN)
    })
  })
})
