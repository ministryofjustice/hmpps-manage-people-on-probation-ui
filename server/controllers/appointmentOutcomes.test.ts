import httpMocks from 'node-mocks-http'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import controllers from '.'
import { getDataValue } from '../utils'
import { renderError } from '../middleware'
import { mockAppResponse } from './mocks'
import { AppointmentOutcomeProps } from '../models/Locals'
import { AppointmentEnforcementAction, AppointmentOutcomeType, AppointmentSessionOutcome } from '../models/Appointments'
import { Activity } from '../data/model/schedule'
import { isSuccessfulUpload } from './appointments'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import { HmppsAuthClient } from '../data'

const crn = 'X000001'
const id = '1234'
const uuid = 'f1654ea3-0abb-46eb-860b-654a96edbe20'
const contactId = '1234'
const change = '/change/url'

jest.mock('../data/masApiClient')
jest.mock('@ministryofjustice/hmpps-audit-client')
jest.mock('uuid', () => ({
  v4: jest.fn(() => uuid),
}))
jest.mock('./appointments', () => ({
  isSuccessfulUpload: jest.fn(),
}))

jest.mock('../data/masApiClient')
jest.mock('../data/tokenStore/redisTokenStore')
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
const isSuccessfulUploadSpy = isSuccessfulUpload as jest.MockedFunction<typeof isSuccessfulUpload>
const auditSpy = jest.spyOn(auditService, 'sendAuditMessage')

const baseUrl = '/crn/X000001/appointments/appointment/1234'
const baseOutcomeUrl = '/case/X000001/appointments/appointment/1234/outcome'
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

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

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

describe('controllers/appointmentOutcomes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Get', () => {
    it('should render the outcome page when getOutcome is called', async () => {
      const req = mockReq()
      const res = mockRes()
      const spy = jest.spyOn(res, 'render')
      await controllers.appointmentOutcomes.getOutcome(hmppsAuthClient)(req, res)
      expect(spy).toHaveBeenCalledWith('pages/appointment-outcomes/outcome')
    })

    it('should send an audit message when getAddNote is called', async () => {
      const res = mockRes()
      await controllers.appointmentOutcomes.getAddNote()(mockReq(), res)
      expect(auditSpy).toHaveBeenCalledWith({
        action: 'ADD_MAS_APPOINTMENT_NOTE',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: uuid,
        service: 'hmpps-manage-people-on-probation-ui',
      })
    })

    it('should delete uploadedFiles session value if it exists when getAddNote is called', async () => {
      const uploadedFiles = [{ filename: 'mock-file.pdf' }] as Express.Multer.File[]
      const req = mockReq({
        request: {
          params: { crn, id, contactId, actionType: 'mockType' },
          session: { cache: { uploadedFiles } },
        },
      })
      await controllers.appointmentOutcomes.getAddNote()(req, mockRes())
      expect(req.session.cache.uploadedFiles).toBeUndefined()
    })

    it('should delete errorMessages session value if it exists when getAddNote is called', async () => {
      const req = mockReq({
        request: {
          session: { errorMessages: { notes: 'Notes error' } },
        },
      })
      await controllers.appointmentOutcomes.getAddNote()(req, mockRes())
      expect(req.session.errorMessages).toBeUndefined()
    })

    it('should delete body session value if it exists when getAddNote', async () => {
      const req = mockReq({ request: { session: { body: { fieldName: 'value' } } } })
      await controllers.appointmentOutcomes.getAddNote()(req, mockRes())
      expect(req.session.body).toBeUndefined()
    })

    it('should render the add note page when getAddNote is called', async () => {
      const res = mockRes()
      const spy = jest.spyOn(res, 'render')
      await controllers.appointmentOutcomes.getAddNote()(mockReq(), res)
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

    test.each`
      controllerName                  | viewName
      ${'getAttendedFailedToComply'}  | ${'pages/appointment-outcomes/attended-failed-to-comply'}
      ${'getAcceptableAbsence'}       | ${'pages/appointment-outcomes/acceptable-absence'}
      ${'getUnacceptableAbsence'}     | ${'pages/appointment-outcomes/unacceptable-absence'}
      ${'getFailedToAttend'}          | ${'pages/appointment-outcomes/failed-to-attend'}
      ${'getEnforcementAction'}       | ${'pages/appointment-outcomes/enforcement-action'}
      ${'getInitiateBreachOrRecall'}  | ${'pages/appointment-outcomes/initiate-breach-or-recall'}
      ${'getSendLetter'}              | ${'pages/appointment-outcomes/send-letter'}
      ${'getUpdateEnforcementAction'} | ${'pages/appointment-outcomes/update-enforcement-action'}
    `(
      'should render the correct view when $controllerName is called',
      async ({
        controllerName,
        viewName,
      }: {
        controllerName: keyof typeof controllers.appointmentOutcomes
        viewName: string
      }) => {
        const res = mockRes()
        const spy = jest.spyOn(res, 'render')
        await controllers.appointmentOutcomes[controllerName](hmppsAuthClient)(mockReq(), res)
        expect(spy).toHaveBeenCalledWith(viewName)
      },
    )
  })

  describe('Post', () => {
    it('should redirect to the error page if params are invalid when postOutcome is called', () => {
      const req = mockReq()
      const res = mockRes({ appointmentOutcome: { isValidParams: false } })
      controllers.appointmentOutcomes.postOutcome()(req, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
    })

    it('should redirect to the correct page when postOutcome is called', () => {
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

    it('should redirect to the error page if params are invalid when postAddNote is called', async () => {
      const req = mockReq()
      const res = mockRes({ appointmentOutcome: { isValidParams: false } })
      await controllers.appointmentOutcomes.postAddNote(hmppsAuthClient)(req, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
    })

    it('should upload the file when postAddNote is called', async () => {
      const file = new File(['file contents'], 'avatar.png', { type: 'image/png' })
      isSuccessfulUploadSpy.mockReturnValueOnce(true)
      const req = mockReq({ request: { file } })
      const res = mockRes({ appointmentOutcome: { uuid: undefined, contactId, id: contactId } })
      const patchDocumentsSpy = jest.spyOn(MasApiClient.prototype, 'patchDocuments')
      await controllers.appointmentOutcomes.postAddNote(hmppsAuthClient)(req, res)
      expect(patchDocumentsSpy).toHaveBeenCalledWith(crn, id, file)
    })

    it('should render the page if upload not successful when postAddNote is called', async () => {
      const file = new File(['file contents'], 'avatar.png', { type: 'image/png' })
      isSuccessfulUploadSpy.mockReturnValueOnce(false)
      const req = mockReq({ request: { file, body: { notes: 'Some notes', sensitive: 'no' } } })
      const res = mockRes({ appointmentOutcome: { uuid: undefined, contactId, id: contactId } })
      const renderSpy = jest.spyOn(res, 'render')
      const patchDocumentsSpy = jest
        .spyOn(MasApiClient.prototype, 'patchDocuments')
        .mockResolvedValueOnce({ statusCode: 500 })
      await controllers.appointmentOutcomes.postAddNote(hmppsAuthClient)(req, res)
      expect(patchDocumentsSpy).toHaveBeenCalledWith(crn, id, file)
      expect(renderSpy).toHaveBeenCalledWith('pages/appointment-outcomes/add-note', {
        uploadError: 'File not uploaded. Please try again.',
        patchResponse: { statusCode: 500 },
        sensitive: 'no',
        notes: 'Some notes',
      })
    })

    it('should redirect to the change url if in req url query when postAddNote is called', async () => {
      const req = mockReq({ request: { query: { change } } })
      const res = mockRes()
      const spy = jest.spyOn(res, 'redirect')
      await controllers.appointmentOutcomes.postAddNote(hmppsAuthClient)(req, res)
      expect(spy).toHaveBeenCalledWith(change)
    })

    it('should redirect to the check your answers page if arrange appointment journey', async () => {
      const req = mockReq()
      const res = mockRes({ appointmentOutcome: { uuid, contactId: undefined, id: uuid } })
      const spy = jest.spyOn(res, 'redirect')
      await controllers.appointmentOutcomes.postAddNote(hmppsAuthClient)(req, res)
      expect(spy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/check-your-answers`)
    })
    it('should redirect to the check your answers page if manage journey and next appointment has not been arranged', async () => {
      const req = mockReq()
      const res = mockRes({
        appointmentOutcome: {
          uuid: undefined,
          contactId,
          id: contactId,
        },
      })
      const spy = jest.spyOn(res, 'redirect')
      await controllers.appointmentOutcomes.postAddNote(hmppsAuthClient)(req, res)
      expect(spy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${contactId}/outcome/next-appointment`)
    })
    it('should redirect to the check your answers page if manage journey and next appointment arranged', async () => {
      const req = mockReq()
      const res = mockRes({
        appointmentOutcome: {
          uuid: undefined,
          contactId,
          id: contactId,
          appointmentSession: { linkedContactId: '123' },
        },
      })
      const spy = jest.spyOn(res, 'redirect')
      await controllers.appointmentOutcomes.postAddNote(hmppsAuthClient)(req, res)
      expect(spy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${contactId}/outcome/check-your-answers`)
    })
  })
})
