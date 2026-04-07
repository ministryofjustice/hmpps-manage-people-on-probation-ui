import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import { getDataValue } from '../utils'
import { renderError } from '../middleware'
import { mockAppResponse } from './mocks'
import { AppointmentOutcomeProps } from '../models/Locals'
import { checkAuditMessage } from './testutils'

const crn = 'X000001'
const id = '1234'
const uuid = 'f1654ea3-0abb-46eb-860b-654a96edbe20'
const contactId = '1234'
const change = '/change/url'

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

const baseUrl = '/crn/X000001/appointment/appointment/1234/outcome'

const mockRes = (appointmentOutcome?: Partial<AppointmentOutcomeProps>) => {
  return mockAppResponse({
    appointmentOutcome: {
      isValidParams: true,
      baseUrl,
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
    session: {
      data: {
        appointments: {
          crn: {
            [contactId]: {
              outcome: {
                type: 'ATTENDED',
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
      const res = mockRes({ isValidParams: false })
      controllers.appointmentOutcomes.postOutcome()(req, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
    })
    it('should redirect to the correct page', () => {
      const req = mockReq()
      const res = mockRes()
      const spy = jest.spyOn(res, 'redirect')
      mockGetDataValue.mockReturnValueOnce('ATTENDED')
      controllers.appointmentOutcomes.postOutcome()(req, res)
      expect(spy).toHaveBeenCalledWith(`${baseUrl}/add-note`)
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
        useDecorator: true,
        maxCharCount: 12000,
      })
    })
  })

  describe('postAddNote', () => {
    it('should redirect to the error page if params are invalid', () => {
      const req = mockReq()
      const res = mockRes({ isValidParams: false })
      controllers.appointmentOutcomes.postAddNote()(req, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
    })
    it('should redirect to the change url if in req url query', () => {
      const req = mockReq({ query: { change } })
      const res = mockRes()
      const spy = jest.spyOn(res, 'redirect')
      controllers.appointmentOutcomes.postAddNote()(req, res)
      expect(spy).toHaveBeenCalledWith(change)
    })
    it('should redirect to the check your answers page if arrange appointment journey', () => {
      const req = mockReq()
      const res = mockRes({ uuid, contactId: undefined, id: uuid })
      const spy = jest.spyOn(res, 'redirect')
      controllers.appointmentOutcomes.postAddNote()(req, res)
      expect(spy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/check-your-answers`)
    })
    it('should redirect to the manage appointment page if manage journey', () => {
      const req = mockReq()
      const res = mockRes({ uuid: undefined, contactId, id: contactId })
      const spy = jest.spyOn(res, 'redirect')
      controllers.appointmentOutcomes.postAddNote()(req, res)
      expect(spy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${contactId}/manage`)
    })
  })
})
