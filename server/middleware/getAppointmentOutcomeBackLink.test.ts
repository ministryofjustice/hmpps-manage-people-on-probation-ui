import httpMocks from 'node-mocks-http'
import { getAppointmentOutcomeBackLink } from './getAppointmentOutcomeBackLink'
import { AppointmentOutcomeType } from '../models/Appointments'
import { AppointmentOutcomeProps } from '../models/Locals'
import { getDataValue } from '../utils'

const nextSpy = jest.fn()
const crn = 'X000001'
const uuid = '9f4e0d84-c1af-4517-89f5-1c04d1aacc13'
const contactId = '12345'
const baseUrl = '/route/to'
const baseOutcomeUrl = '/route/to/outcome'
const reqUrl = ''

type SelectedOutcomeTypes = {
  [K in AppointmentOutcomeType]?: string
}

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    getDataValue: jest.fn(),
  }
})

const mockGetDataValue = getDataValue as jest.MockedFunction<typeof getDataValue>

const appointment = (id: string, type: AppointmentOutcomeType) => ({
  appointments: {
    [crn]: {
      [id]: {
        outcome: {
          type,
        },
      },
    },
  },
})

const mockReq = ({
  id = uuid,
  request = {},
  outcomeType = 'ATTENDED_COMPLIED',
}: {
  id?: string
  request?: Record<string, any>
  outcomeType?: AppointmentOutcomeType
}): httpMocks.MockRequest<any> => {
  const req = {
    body: appointment(id, outcomeType),
    session: {
      data: appointment(id, outcomeType),
    },
    ...request,
  }
  return httpMocks.createRequest(req)
}

const mockRes = (appointmentOutcome: Partial<AppointmentOutcomeProps> = {}): httpMocks.MockResponse<any> => {
  const res = {
    locals: {
      appointmentOutcome: {
        baseOutcomeUrl,
        baseUrl,
        reqUrl,
        crn,
        ...appointmentOutcome,
      },
    },
  }
  return httpMocks.createResponse(res)
}

describe('/middleware/getAppointmentOutcomeBackLink()', () => {
  const checkBackLinks = ({
    arrangeAppointmentJourney = true,
    requestMethod,
  }: {
    arrangeAppointmentJourney?: boolean
    requestMethod: 'GET' | 'POST'
  }) => {
    const request = requestMethod === 'GET' ? { body: {} } : { session: {} }
    const req = mockReq({ request, id: arrangeAppointmentJourney ? uuid : contactId })
    const localsVars = arrangeAppointmentJourney ? { uuid, id: uuid } : { id: contactId, contactId }
    it('should return correct link if on outcome page', () => {
      const res = mockRes({ reqUrl: baseOutcomeUrl, ...localsVars })
      getAppointmentOutcomeBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(
        arrangeAppointmentJourney ? `${baseUrl}/location-date-time` : `${baseUrl}/manage`,
      )
    })
    it('should return correct link if on attended complied page', () => {
      const res = mockRes({ reqUrl: `${baseOutcomeUrl}/attended-complied`, ...localsVars })
      getAppointmentOutcomeBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(baseOutcomeUrl)
    })
    it('should return correct link if on attended failed to comply page', () => {
      const res = mockRes({ reqUrl: `${baseOutcomeUrl}/attended-failed-to-comply`, ...localsVars })
      getAppointmentOutcomeBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(baseOutcomeUrl)
    })
    it('should return correct link if on acceptable absence page', () => {
      const res = mockRes({ reqUrl: `${baseOutcomeUrl}/acceptable-absence`, ...localsVars })
      getAppointmentOutcomeBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(baseOutcomeUrl)
    })
    it('should return correct link if on unacceptable absence page', () => {
      const res = mockRes({ reqUrl: `${baseOutcomeUrl}/unacceptable-absence`, ...localsVars })
      getAppointmentOutcomeBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(baseOutcomeUrl)
    })
    it('should return correct link if on failed to attend page', () => {
      const res = mockRes({ reqUrl: `${baseOutcomeUrl}/failed-to-attend`, ...localsVars })
      getAppointmentOutcomeBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(baseOutcomeUrl)
    })

    const outcomePages = {
      'enforcement action page': 'enforcement-action',
      'send a letter page': 'send-letter',
      'initiate breach or recall page': 'initiate-breach-or-recall',
    }

    const selectedOutcomeTypes: SelectedOutcomeTypes = {
      ATTENDED_SENT_HOME_BEHAVIOUR: 'attended-failed-to-comply',
      ATTENDED_FAILED_TO_COMPLY: 'attended-failed-to-comply',
      ATTENDED_SENT_HOME_SERVICE_ISSUES: 'attended-failed-to-comply',
      UNACCEPTABLE_ABSENCE: 'unacceptable-absence',
      FAILED_TO_ATTEND: 'failed-to-attend',
    }
    Object.entries(outcomePages).forEach(([pageTitle, pageUrl]) => {
      Object.entries(selectedOutcomeTypes).forEach(([type, url]: [AppointmentOutcomeType, string]) => {
        it(`should return correct link if on ${pageTitle} and selected outcome is ${type}`, () => {
          const mockedReq = mockReq({ id: arrangeAppointmentJourney ? uuid : contactId, outcomeType: type, request })
          const res = mockRes({ reqUrl: `${baseOutcomeUrl}/${pageUrl}`, ...localsVars })
          mockGetDataValue.mockReturnValue(type)
          getAppointmentOutcomeBackLink(mockedReq, res, nextSpy)
          expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/${url}`)
        })
      })
    })
  }
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Arrange appointment journey', () => {
    describe('POST request', () => {
      checkBackLinks({ requestMethod: 'POST' })
    })
    describe('GET request', () => {
      checkBackLinks({ requestMethod: 'GET' })
    })
  })

  describe('Manage appointment journey', () => {
    describe('POST request', () => {
      checkBackLinks({ arrangeAppointmentJourney: false, requestMethod: 'POST' })
    })
    describe('GET request', () => {
      checkBackLinks({ arrangeAppointmentJourney: false, requestMethod: 'GET' })
    })
  })
})
