import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import { getDataValue } from '../utils'
import { renderError } from '../middleware'
import { mockAppResponse, mockPersonAppointment } from './mocks'
import { AppointmentOutcomeProps } from '../models/Locals'
import { checkAuditMessage } from './testutils'
import MasApiClient from '../data/masApiClient'
import { isSuccessfulUpload } from './appointments'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { AppointmentEnforcementAction, AppointmentOutcomeType } from '../models/Appointments'
import { appointmentOutcomeRequests } from './appointmentOutcomes'

const crn = 'X000001'
const id = '1234'
const uuid = 'f1654ea3-0abb-46eb-860b-654a96edbe20'
const contactId = '1234'
const change = '/change/url'

const mockFile = {
  fieldname: 'fileUpload',
  originalname: 'mock-file.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  buffer: [] as any,
  size: 584020,
}

jest.mock('../data/masApiClient')

jest.mock('../data/masApiClient')

jest.mock('../data/masApiClient')

const mockHmppsAuthClient = {
  getSystemClientToken: jest.fn().mockResolvedValue('token'),
} as any

jest.mock('../data/masApiClient')
jest.mock('../data/tokenStore/redisTokenStore')
jest.mock('@ministryofjustice/hmpps-audit-client')
jest.mock('uuid', () => ({
  v4: jest.fn(() => uuid),
}))

jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})

jest.mock('./appointments', () => {
  return {
    isSuccessfulUpload: jest.fn(),
  }
})

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
    setDataValue: jest.fn(),
    getDataValue: jest.fn(),
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

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const isSuccessfulUploadMock = isSuccessfulUpload as jest.MockedFunction<typeof isSuccessfulUpload>
const mockRenderError = renderError as jest.MockedFunction<typeof renderError>
const mockGetDataValue = getDataValue as jest.MockedFunction<typeof getDataValue>

const baseUrl = '/crn/X000001/appointment/appointment/1234'
const baseOutcomeUrl = '/crn/X000001/appointment/appointment/1234/outcome'
const completedUrl = `/completed/route`
const patchAppointmentSpy = jest
  .spyOn(MasApiClient.prototype, 'patchAppointment')
  .mockImplementation(() => Promise.resolve(mockPersonAppointment))

const patchDocumentResponse = {
  statusCode: 200,
}
const patchDocumentsSpy = jest.spyOn(MasApiClient.prototype, 'patchDocuments').mockResolvedValue(patchDocumentResponse)

const mockRes = ({
  appointmentOutcome,
  appointmentCase,
}: {
  appointmentOutcome?: Partial<AppointmentOutcomeProps>
  appointmentCase?: Record<string, any>
} = {}) => {
  return mockAppResponse({
    user: { username: 'user1' },
    case: { name: { forename: 'Stuart' }, ...(appointmentCase ?? {}) },
    appointmentOutcome: {
      isValidParams: true,
      baseUrl,
      baseOutcomeUrl,
      completedUrl,
      contactId,
      uuid,
      id: contactId,
      crn,
      forename: 'Forename',
      surname: 'Surname',
      ...(appointmentOutcome ?? {}),
    },
  })
}

const mockReq = (request: Record<string, any> = {}): httpMocks.MockRequest<any> => {
  const req = {
    params: { crn: 'R000101' },
    session: {
      data: {
        appointments: {
          crn: {
            [contactId]: {
              outcome: {
                type: 'ATTENDED_COMPLIED',
              },
            },
          },
        },
      },
    },
    ...(request ?? {}),
  }
  return httpMocks.createRequest(req)
}

type ExpectedRedirect = Partial<Record<AppointmentOutcomeType | AppointmentEnforcementAction, string>>

const expectedRedirect: ExpectedRedirect = {
  ATTENDED_COMPLIED: `${baseOutcomeUrl}/add-note`,
  ATTENDED_FAILED_TO_COMPLY: `${baseOutcomeUrl}/attended-failed-to-comply`,
  ATTENDED_SENT_HOME_BEHAVIOUR: `${baseOutcomeUrl}/attended-failed-to-comply`,
  ATTENDED_SENT_HOME_SERVICE_ISSUES: `${baseOutcomeUrl}/attended-failed-to-comply`,
  ACCEPTABLE_ABSENCE: `${baseOutcomeUrl}/acceptable-absence`,
  UNACCEPTABLE_ABSENCE: `${baseOutcomeUrl}/unacceptable-absence`,
  FAILED_TO_ATTEND: `${baseOutcomeUrl}/failed-to-attend`,
  WILL_BE_RESCHEDULED: `/case/${crn}/appointment/${contactId}/reschedule`,
  SEND_LETTER: `${baseOutcomeUrl}/send-letter`,
  INITIATE_BREACH_RECALL: `${baseOutcomeUrl}/initiate-breach-or-recall`,
  INITIATE_BREACH_RECALL_AND_SEND_LETTER: `${baseOutcomeUrl}/initiate-breach-or-recall`,
  DECISION_PENDING: `${baseOutcomeUrl}/add-note`,
  REFER_TO_OFFENDER_MANAGER: `${baseOutcomeUrl}/add-note`,
  NO_FURTHER_ACTION: `${baseOutcomeUrl}/add-note`,
  DIFFERENT_ACTION: `${baseOutcomeUrl}/enforcement-action`,
}

const checkRedirects = (
  controller: (typeof appointmentOutcomeRequests)[number],
  expectedOptions: AppointmentEnforcementAction[] | AppointmentOutcomeType[],
): void => {
  expectedOptions.forEach(option => {
    const req = mockReq()
    const res = mockRes()
    const spy = jest.spyOn(res, 'redirect')
    mockGetDataValue.mockReturnValueOnce(option)
    controllers.appointmentOutcomes[controller]()(req, res)
    expect(spy).toHaveBeenCalledWith(expectedRedirect[option])
  })
}

describe('controllers/appointmentOutcomes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('getOutcome', () => {
    const req = mockReq()
    const res = mockRes()
    beforeEach(async () => {
      controllers.appointmentOutcomes.getOutcome()(req, res)
    })
    it('should render the outcome page', () => {
      const spy = jest.spyOn(res, 'render')
      expect(spy).toHaveBeenCalledWith('pages/appointment-outcomes/outcome')
    })
  })

  describe('postOutcome', () => {
    it('should redirect to the error page if params are invalid', () => {
      const req = mockReq()
      const res = mockRes({ appointmentOutcome: { isValidParams: false } })
      controllers.appointmentOutcomes.postOutcome()(req, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
    })
    it('should redirect to the correct page', () => {
      const expectedOptions: AppointmentOutcomeType[] = [
        'ATTENDED_COMPLIED',
        'ATTENDED_FAILED_TO_COMPLY',
        'ATTENDED_SENT_HOME_BEHAVIOUR',
        'ATTENDED_SENT_HOME_SERVICE_ISSUES',
        'ACCEPTABLE_ABSENCE',
        'UNACCEPTABLE_ABSENCE',
        'FAILED_TO_ATTEND',
        'WILL_BE_RESCHEDULED',
      ]
      checkRedirects('postOutcome', expectedOptions)
    })
  })

  describe('getAddNote', () => {
    const uploadedFiles = [{ filename: 'mock-file.pdf' }] as Express.Multer.File[]
    const errorMessages = {
      notes: 'Notes error',
      sensitivity: 'Sensitivity error',
    }
    const actionType = 'mockType'
    const req = mockReq({
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
    const res = mockRes()
    const spy = jest.spyOn(res, 'render')
    beforeEach(() => {
      controllers.appointmentOutcomes.getAddNote()(req, res)
    })
    checkAuditMessage(res, 'ADD_MAS_APPOINTMENT_NOTE', uuidv4(), crn, 'CRN')
    it('should delete uploadedFiles session value if it exists', () => {
      expect(req.session.cache.uploadedFiles).toBeUndefined()
    })
    it('should delete errorMessages session value if it exists', () => {
      expect(req.session.errorMessages).toBeUndefined()
    })
    it('should delete body session value if it exists', () => {
      expect(req.session.body).toBeUndefined()
    })
    it('should render the add note page', () => {
      expect(spy).toHaveBeenCalledWith('pages/appointment-outcomes/add-note', {
        body: null,
        validMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        fileUploadLimit: 5,
        maxFileSize: 5242880,
        errorMessages: null,
        uploadedFiles: [],
        maxCharCount: 12000,
      })
    })
  })

  describe('postAddNote', () => {
    const sensitivity = 'No'
    const notes = 'Mock notes'
    it('should redirect to the error page if params are invalid', async () => {
      const req = mockReq()
      const res = mockRes({ appointmentOutcome: { isValidParams: false, appointmentSession: { sensitivity, notes } } })
      await controllers.appointmentOutcomes.postAddNote(hmppsAuthClient)(req, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
    })
    it('should redirect to check your answers page if arrange appointment journey', async () => {
      const req = mockReq()
      const res = mockRes({
        appointmentOutcome: {
          appointmentSession: { sensitivity, notes },
          uuid,
          contactId: undefined,
          id: uuid,
        },
      })
      const spy = jest.spyOn(res, 'redirect')
      await controllers.appointmentOutcomes.postAddNote(hmppsAuthClient)(req, res)
      expect(spy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/check-your-answers`)
    })
    it('should patch the appointment if manage journey', async () => {
      const req = mockReq()
      const res = mockRes({
        appointmentOutcome: {
          appointmentSession: { sensitivity, notes },
          uuid: undefined,
          contactId,
          id: contactId,
        },
      })
      await controllers.appointmentOutcomes.postAddNote(hmppsAuthClient)(req, res)
      expect(patchAppointmentSpy).toHaveBeenCalledWith({
        id: parseInt(contactId, 10),
        notes,
        sensitive: false,
        outcomeRecorded: true,
      })
    })
    it('should patch the file upload if exists', async () => {
      const req = mockReq({ file: mockFile })
      const res = mockRes({
        appointmentOutcome: {
          appointmentSession: { sensitivity, notes },
          uuid: undefined,
          contactId,
          id: contactId,
        },
      })
      isSuccessfulUploadMock.mockReturnValue(true)
      await controllers.appointmentOutcomes.postAddNote(hmppsAuthClient)(req, res)
      expect(patchDocumentsSpy).toHaveBeenCalledWith(crn, contactId, mockFile)
    })
    it('should render the upload error', async () => {
      const req = mockReq({ file: mockFile })
      const res = mockRes({
        appointmentOutcome: {
          appointmentSession: { sensitivity, notes },
          uuid: undefined,
          contactId,
          id: contactId,
        },
      })
      const spy = jest.spyOn(res, 'render')
      isSuccessfulUploadMock.mockReturnValue(false)
      await controllers.appointmentOutcomes.postAddNote(hmppsAuthClient)(req, res)
      expect(spy).toHaveBeenCalledWith('pages/appointment-outcomes/add-note', {
        uploadError: 'File not uploaded. Please try again.',
        patchResponse: patchDocumentResponse,
        sensitive: false,
        notes,
      })
    })
  })

  describe('getAttendedFailedToComply', () => {
    it('should render the correct view', async () => {
      const req = mockReq()
      const res = mockRes()
      const spy = jest.spyOn(res, 'render')
      controllers.appointmentOutcomes.getAttendedFailedToComply()(req, res)
      expect(spy).toHaveBeenCalledWith('pages/appointment-outcomes/attended-failed-to-comply')
    })
  })

  describe('postAttendedFailedToComply', () => {
    it('should redirect to the correct page based on enforcement action', async () => {
      const checks = {
        SEND_LETTER: `${baseOutcomeUrl}/send-letter`,
        INITIATE_BREACH_RECALL: `${baseOutcomeUrl}/initiate-breach-or-recall`,
        INITIATE_BREACH_RECALL_AND_SEND_LETTER: `${baseOutcomeUrl}/initiate-breach-or-recall`,
        REFER_TO_OFFENDER_MANAGER: `${baseOutcomeUrl}/add-note`,
        NO_FURTHER_ACTION: `${baseOutcomeUrl}/add-note`,
        DIFFERENT_ACTION: `${baseOutcomeUrl}/enforcement-action`,
      }
      Object.entries(checks).forEach(([enforcementAction, redirectUrl]) => {
        const req = mockReq()
        const res = mockRes()
        const spy = jest.spyOn(res, 'redirect')
        mockGetDataValue.mockReturnValueOnce(enforcementAction)
        controllers.appointmentOutcomes.postAttendedFailedToComply()(req, res)
        expect(spy).toHaveBeenCalledWith(redirectUrl)
      })
    })
  })

  describe('getAttendedFailedToComply', () => {
    it('should render the correct view', async () => {
      const req = mockReq()
      const res = mockRes()
      const spy = jest.spyOn(res, 'render')
      controllers.appointmentOutcomes.getAttendedFailedToComply()(req, res)
      expect(spy).toHaveBeenCalledWith('pages/appointment-outcomes/attended-failed-to-comply')
    })
  })

  describe('postAttendedFailedToComply', () => {
    it('should redirect to the correct page based on enforcement action', () => {
      const expectedOptions: AppointmentEnforcementAction[] = [
        'SEND_LETTER',
        'INITIATE_BREACH_RECALL',
        'INITIATE_BREACH_RECALL_AND_SEND_LETTER',
        'REFER_TO_OFFENDER_MANAGER',
        'NO_FURTHER_ACTION',
        'DIFFERENT_ACTION',
      ]
      checkRedirects('postAttendedFailedToComply', expectedOptions)
    })
  })
  describe('getAcceptableAbsence', () => {
    it('should render the correct view', async () => {
      const req = mockReq()
      const res = mockRes()
      const spy = jest.spyOn(res, 'render')
      controllers.appointmentOutcomes.getAcceptableAbsence()(req, res)
      expect(spy).toHaveBeenCalledWith('pages/appointment-outcomes/acceptable-absence')
    })
  })
  describe('postAcceptableAbsence', () => {
    it('should redirect to the add note page', () => {
      const req = mockReq()
      const res = mockRes()
      const spy = jest.spyOn(res, 'redirect')
      controllers.appointmentOutcomes.postAcceptableAbsence()(req, res)
      expect(spy).toHaveBeenCalledWith(`${baseOutcomeUrl}/add-note`)
    })
  })
  describe('getUnacceptableAbsence', () => {
    it('should render the correct view', async () => {
      const req = mockReq()
      const res = mockRes()
      const spy = jest.spyOn(res, 'render')
      controllers.appointmentOutcomes.getUnacceptableAbsence()(req, res)
      expect(spy).toHaveBeenCalledWith('pages/appointment-outcomes/unacceptable-absence')
    })
  })
  describe('postUnacceptableAbsence', () => {
    it('should redirect to the correct page based on enforcement action', () => {
      const expectedOptions: AppointmentEnforcementAction[] = [
        'SEND_LETTER',
        'INITIATE_BREACH_RECALL',
        'INITIATE_BREACH_RECALL_AND_SEND_LETTER',
        'REFER_TO_OFFENDER_MANAGER',
        'NO_FURTHER_ACTION',
        'DIFFERENT_ACTION',
      ]
      checkRedirects('postUnacceptableAbsence', expectedOptions)
    })
  })
  describe('getFailedToAttend', () => {
    it('should render the correct view', async () => {
      const req = mockReq()
      const res = mockRes()
      const spy = jest.spyOn(res, 'render')
      controllers.appointmentOutcomes.getFailedToAttend()(req, res)
      expect(spy).toHaveBeenCalledWith('pages/appointment-outcomes/failed-to-attend')
    })
  })
  describe('postFailedToAttend', () => {
    it('should redirect to the correct page based on enforcement action', () => {
      const expectedOptions: AppointmentEnforcementAction[] = [
        'SEND_LETTER',
        'DECISION_PENDING',
        'REFER_TO_OFFENDER_MANAGER',
        'DIFFERENT_ACTION',
      ]
      checkRedirects('postFailedToAttend', expectedOptions)
    })
  })
})
