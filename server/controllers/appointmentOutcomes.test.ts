import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import { getDataValue } from '../utils'
import { renderError } from '../middleware'
import { mockAppResponse } from './mocks'
import { AppointmentOutcomeProps, AppResponse } from '../models/Locals'
import { checkAuditMessage } from './testutils'
import { AppointmentEnforcementAction, AppointmentOutcomeType, AppointmentSessionOutcome } from '../models/Appointments'
import { appointmentOutcomeRequests } from './appointmentOutcomes'
import { Activity } from '../data/model/schedule'

const crn = 'X000001'
const id = '1234'
const uuid = 'f1654ea3-0abb-46eb-860b-654a96edbe20'
const contactId = '1234'
const change = '/change/url'

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

const mockRenderError = renderError as jest.MockedFunction<typeof renderError>
const mockGetDataValue = getDataValue as jest.MockedFunction<typeof getDataValue>

const baseUrl = '/crn/X000001/appointment/appointment/1234'
const baseOutcomeUrl = '/crn/X000001/appointment/appointment/1234/outcome'
const completedUrl = `/completed/route`

const mockRes = ({
  appointmentOutcome,
  appointmentCase,
}: {
  appointmentOutcome?: Partial<AppointmentOutcomeProps<Activity>>
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

const mockReq = ({
  request = {},
  type = 'ATTENDED_COMPLIED',
  enforcementAction = {},
}: {
  request?: Record<string, any>
  type?: AppointmentOutcomeType
  enforcementAction?: { [K in keyof AppointmentSessionOutcome]: AppointmentEnforcementAction }
} = {}): httpMocks.MockRequest<any> => {
  const req = {
    params: { crn: 'R000101' },
    session: {
      data: {
        appointments: {
          crn: {
            [contactId]: {
              outcome: {
                type,
                ...enforcementAction,
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
  BREACH_RECALL_INITIATED: `${baseOutcomeUrl}/initiate-breach-or-recall`,
  BREACH_RECALL_INITIATED_AND_SEND_LETTER: `${baseOutcomeUrl}/initiate-breach-or-recall`,
  DECISION_PENDING_RESPONSE_FROM_PERSON_ON_PROBATION: `${baseOutcomeUrl}/add-note`,
  REFER_TO_OFFENDER_MANAGER: `${baseOutcomeUrl}/add-note`,
  NO_FURTHER_ACTION: `${baseOutcomeUrl}/add-note`,
  DIFFERENT_ACTION: `${baseOutcomeUrl}/enforcement-action`,
  SEND_ANOTHER_LETTER: `${baseOutcomeUrl}/send-letter`,
  WITHDRAW_WARNING_LETTER: `${baseOutcomeUrl}/add-note`,
  BREACH_REQUESTED: `${baseOutcomeUrl}/add-note`,
  BREACH_CONFIRMATION_SENT: `${baseOutcomeUrl}/add-note`,
  BREACH_LETTER_SENT: `${baseOutcomeUrl}/add-note`,
  BREACH_REQUEST_ACTIONED: `${baseOutcomeUrl}/add-note`,
}

const checkOutcomeRedirects = (expectedOptions: AppointmentOutcomeType[]): void => {
  expectedOptions.forEach(option => {
    const req = mockReq()
    const res = mockRes({ appointmentOutcome: { appointmentSession: { outcome: { outcomeType: option } } } })
    const spy = jest.spyOn(res, 'redirect')
    mockGetDataValue.mockReturnValueOnce(option)
    controllers.appointmentOutcomes.postOutcome()(req, res)
    expect(spy).toHaveBeenCalledWith(expectedRedirect[option])
  })
}

const checkEnforcementActionRedirects = ({
  controller = 'postAttendedFailedToComply',
  pageKey = 'attendedFailedToComply',
  expectedOptions = [],
}: {
  controller?: (typeof appointmentOutcomeRequests)[number]
  pageKey?: keyof AppointmentSessionOutcome
  expectedOptions?: AppointmentEnforcementAction[]
} = {}): void => {
  expectedOptions.forEach(option => {
    const req = mockReq()
    const res = mockRes({ appointmentOutcome: { appointmentSession: { outcome: { [pageKey]: option } } } })
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
      checkOutcomeRedirects(expectedOptions)
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
      request: {
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
        useDecorator: true,
        maxCharCount: 12000,
      })
    })
  })

  describe('postAddNote', () => {
    it('should redirect to the error page if params are invalid', () => {
      const req = mockReq()
      const res = mockRes({ appointmentOutcome: { isValidParams: false } })
      controllers.appointmentOutcomes.postAddNote()(req, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
    })
    it('should redirect to the change url if in req url query', () => {
      const req = mockReq({ request: { query: { change } } })
      const res = mockRes()
      const spy = jest.spyOn(res, 'redirect')
      controllers.appointmentOutcomes.postAddNote()(req, res)
      expect(spy).toHaveBeenCalledWith(change)
    })
    it('should redirect to the check your answers page if arrange appointment journey', () => {
      const req = mockReq()
      const res = mockRes({ appointmentOutcome: { uuid, contactId: undefined, id: uuid } })
      const spy = jest.spyOn(res, 'redirect')
      controllers.appointmentOutcomes.postAddNote()(req, res)
      expect(spy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/check-your-answers`)
    })
    it('should redirect to the manage appointment page if manage journey', () => {
      const req = mockReq()
      const res = mockRes({ appointmentOutcome: { uuid: undefined, contactId, id: contactId } })
      const spy = jest.spyOn(res, 'redirect')
      controllers.appointmentOutcomes.postAddNote()(req, res)
      expect(spy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${contactId}/manage`)
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
        'BREACH_RECALL_INITIATED',
        'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
        'REFER_TO_OFFENDER_MANAGER',
        'NO_FURTHER_ACTION',
        'DIFFERENT_ACTION',
      ]
      checkEnforcementActionRedirects({
        controller: 'postAttendedFailedToComply',
        pageKey: 'attendedFailedToComply',
        expectedOptions,
      })
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
        'BREACH_RECALL_INITIATED',
        'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
        'REFER_TO_OFFENDER_MANAGER',
        'NO_FURTHER_ACTION',
        'DIFFERENT_ACTION',
      ]
      checkEnforcementActionRedirects({
        controller: 'postUnacceptableAbsence',
        pageKey: 'unacceptableAbsence',
        expectedOptions,
      })
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
        'DECISION_PENDING_RESPONSE_FROM_PERSON_ON_PROBATION',
        'REFER_TO_OFFENDER_MANAGER',
        'DIFFERENT_ACTION',
      ]
      checkEnforcementActionRedirects({ controller: 'postFailedToAttend', pageKey: 'failedToAttend', expectedOptions })
    })
  })
  describe('getEnforcementAction', () => {
    it('should render the correct view', async () => {
      const req = mockReq()
      const res = mockRes()
      const spy = jest.spyOn(res, 'render')
      controllers.appointmentOutcomes.getEnforcementAction()(req, res)
      expect(spy).toHaveBeenCalledWith('pages/appointment-outcomes/enforcement-action')
    })
  })
  describe('postEnforcementAction', () => {
    it('should redirect to the add note page', () => {
      const req = mockReq()
      const res = mockRes()
      const spy = jest.spyOn(res, 'redirect')
      controllers.appointmentOutcomes.postEnforcementAction()(req, res)
      expect(spy).toHaveBeenCalledWith(`${baseOutcomeUrl}/add-note`)
    })
  })
  describe('getInitiateBreachOrRecall', () => {
    it('should render the correct view', async () => {
      const req = mockReq()
      const res = mockRes()
      const spy = jest.spyOn(res, 'render')
      controllers.appointmentOutcomes.getInitiateBreachOrRecall()(req, res)
      expect(spy).toHaveBeenCalledWith('pages/appointment-outcomes/initiate-breach-or-recall')
    })
  })
  describe('postInitiateBreachOrRecall', () => {
    it('should redirect to the add note page', () => {
      const req = mockReq()
      const res = mockRes()
      const spy = jest.spyOn(res, 'redirect')
      controllers.appointmentOutcomes.postInitiateBreachOrRecall()(req, res)
      expect(spy).toHaveBeenCalledWith(`${baseOutcomeUrl}/add-note`)
    })
  })
  describe('getUpdateEnforcementAction', () => {
    it('should render the correct view', async () => {
      const req = mockReq()
      const res = mockRes()
      const spy = jest.spyOn(res, 'render')
      controllers.appointmentOutcomes.getUpdateEnforcementAction()(req, res)
      expect(spy).toHaveBeenCalledWith('pages/appointment-outcomes/update-enforcement-action')
    })
  })

  describe('postUpdateEnforcementAction', () => {
    it('should redirect to the correct page', () => {
      const expectedOptions: AppointmentEnforcementAction[] = [
        'SEND_ANOTHER_LETTER',
        'BREACH_RECALL_INITIATED',
        'WITHDRAW_WARNING_LETTER',
        'NO_FURTHER_ACTION',
        'DIFFERENT_ACTION',
        'SEND_LETTER',
        'BREACH_RECALL_INITIATED',
        'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
        'BREACH_REQUESTED',
        'BREACH_CONFIRMATION_SENT',
        'BREACH_LETTER_SENT',
        'BREACH_REQUEST_ACTIONED',
        'WITHDRAW_WARNING_LETTER',
        'NO_FURTHER_ACTION',
        'DIFFERENT_ACTION',
      ]
      checkEnforcementActionRedirects({
        controller: 'postUpdateEnforcementAction',
        pageKey: 'updateEnforcementAction',
        expectedOptions,
      })
    })
  })
})
