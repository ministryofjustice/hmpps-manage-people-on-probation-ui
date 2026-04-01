import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { setDataValue, getDataValue } from '../utils'
import { checkAuditMessage } from './testutils'
import { renderError } from '../middleware'
import { mockAppResponse } from './mocks'
import { AppointmentOutcomeProps } from '../models/Locals'

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
    setDataValue: jest.fn(),
    getDataValue: jest.fn(),
  }
})
const mockMiddlewareFn = jest.fn()
jest.mock('../middleware', () => ({
  cloneAppointmentAndRedirect: jest.fn(() => mockMiddlewareFn),
  renderError: jest.fn(() => mockMiddlewareFn),
  getAttendedCompliedProps: jest.fn(),
}))

jest.mock('./arrangeAppointment', () => ({
  redirectToSentence: jest.fn(() => mockMiddlewareFn),
  getSentence: jest.fn(() => mockMiddlewareFn),
}))

const mockRenderError = renderError as jest.MockedFunction<typeof renderError>
const mockGetDataValue = getDataValue as jest.MockedFunction<typeof getDataValue>
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const mockSetDataValue = setDataValue as jest.MockedFunction<typeof setDataValue>

const baseUrl = '/crn/X000001/appointment/appointment/1234/outcome'

const mockRes = (appointmentOutcome?: Partial<AppointmentOutcomeProps>) => {
  return mockAppResponse({
    appointmentOutcome: {
      isValidParams: true,
      baseUrl,
      contactId,
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
    ...(request ?? {}),
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
      expect(spy).toHaveBeenCalledWith(`${baseUrl}/attended-complied`)
    })
  })

  describe('getAttendedComplied', () => {
    const req = mockReq()
    const res = mockRes()
    const renderSpy = jest.spyOn(res, 'render')
    beforeEach(async () => {
      await controllers.appointmentOutcomes.getAttendedComplied(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_RECORD_AN_OUTCOME', uuidv4(), crn, 'CRN')
    it('should render the record an outcome page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/appointment-outcomes/attended-complied', {
        alertDismissed: false,
        isInPast: true,
        headerPersonName: { forename: 'Forename', surname: 'Surname' },
      })
    })
  })

  describe('postAttendedComplied', () => {
    const req = mockReq({
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
    it('should redirect to the error page if params are invalid', () => {
      const res = mockRes({ isValidParams: false })
      controllers.appointmentOutcomes.postAttendedComplied()(req, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
    })
    it('should set the outcome recorded session', () => {
      const res = mockRes()
      controllers.appointmentOutcomes.postAttendedComplied()(req, res)
      expect(mockSetDataValue).toHaveBeenCalledWith(
        req.session.data,
        ['appointments', crn, contactId, 'outcomeRecorded'],
        true,
      )
    })
    it('should redirect to the add notes page', () => {
      const res = mockRes()
      const redirectSpy = jest.spyOn(res, 'redirect')
      controllers.appointmentOutcomes.postAttendedComplied()(req, res)
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${id}/add-note`)
    })
  })
})
