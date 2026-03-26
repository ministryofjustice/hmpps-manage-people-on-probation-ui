import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import { isValidCrn, isNumericString, setDataValue } from '../utils'
import { checkAuditMessage } from './testutils'
import { renderError } from '../middleware'
import { mockAppResponse, mockPersonAppointment } from './mocks'
import { Activity } from '../data/model/schedule'
import { AttendedCompliedAppointment } from '../models/Appointments'

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
    canRescheduleAppointment: jest.fn(),
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
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const mockIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>
const mockIsNumericString = isNumericString as jest.MockedFunction<typeof isNumericString>
const mockSetDataValue = setDataValue as jest.MockedFunction<typeof setDataValue>

const patchAppointmentSpy = jest
  .spyOn(MasApiClient.prototype, 'patchAppointment')
  .mockImplementation(() => Promise.resolve(mockPersonAppointment))

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

const renderSpy = jest.spyOn(res, 'render')
const redirectSpy = jest.spyOn(res, 'redirect')

xdescribe('controllers/appointmentOutcomes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAttendedComplied', () => {
    beforeEach(async () => {
      await controllers.appointmentOutcomes.getAttendedComplied(hmppsAuthClient)(req, res)
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

  describe('postAttendedComplied', () => {
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
        await controllers.appointmentOutcomes.postAttendedComplied(hmppsAuthClient)(mockReq, res)
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

  /*
  const testCases = [
    ['getOutcome', 'pages/appointments-outcomes/outcome'],
    ['postOutcome', 'pages/appointments-outcomes/outcome'],
<<<<<<< HEAD
    ['getAttendedFailedToComply', 'pages/appointments-outcomes/attended-failed-to-comply'],
    ['postAttendedFailedToComply', 'pages/appointments-outcomes/attended-failed-to-comply'],
=======
    ['getAttendedFailedToComply', 'pages/appointments-outcomes/failed-to-comply'],
    ['postAttendedFailedToComply', 'pages/appointments-outcomes/failed-to-comply'],
>>>>>>> aaf8d338 (MAN-2067 outcomes page wip)
    ['getAcceptableAbsence', 'pages/appointments-outcomes/acceptable-absence'],
    ['postAcceptableAbsence', 'pages/appointments-outcomes/acceptable-absence'],
    ['getUnacceptableAbsence', 'pages/appointments-outcomes/unacceptable-absence'],
    ['postUnacceptableAbsence', 'pages/appointments-outcomes/unacceptable-absence'],
    ['getFailedToAttend', 'pages/appointments-outcomes/failed-to-attend'],
    ['postFailedToAttend', 'pages/appointments-outcomes/failed-to-attend'],
    ['getEnforcementAction', 'pages/appointments-outcomes/enforcement-action'],
    ['postEnforcementAction', 'pages/appointments-outcomes/enforcement-action'],
    ['getInitiateBreachOrRecall', 'pages/appointments-outcomes/initiate-breach-or-recall'],
    ['postInitiateBreachOrRecall', 'pages/appointments-outcomes/initiate-breach-or-recall'],
    ['getSendLetter', 'pages/appointments-outcomes/send-letter'],
    ['postSendLetter', 'pages/appointments-outcomes/send-letter'],
    ['getUpdateEnforcementAction', 'pages/appointments-outcomes/update-enforcement-action'],
    ['postUpdateEnforcementAction', 'pages/appointments-outcomes/update-enforcement-action'],
  ] as const

  it.each(testCases)('should render correct view for %s', async (routeName, expectedView) => {
    const handlerFactory = (appointmentOutcomesController as any)[routeName]

    const handler = handlerFactory(null) // hmppsAuthClient not used
    await handler(mockReq, mockRes)

    expect(mockRes.render).toHaveBeenCalledWith(expectedView)
  })

  */
})
