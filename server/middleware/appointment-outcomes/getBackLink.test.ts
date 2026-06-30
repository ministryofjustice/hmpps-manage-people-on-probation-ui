import httpMocks from 'node-mocks-http'
import { getBackLink } from './getBackLink'
import { AppointmentEnforcementAction, AppointmentOutcomeType } from '../../models/Appointments'
import { AppointmentOutcomeProps } from '../../models/Locals'
import { Activity } from '../../data/model/schedule'

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

const appointment = (
  id: string,
  outcomeType: AppointmentOutcomeType,
  otherEnforcementAction: AppointmentEnforcementAction = null,
  updateEnforcementAction: AppointmentEnforcementAction = null,
) => ({
  appointments: {
    [crn]: {
      [id]: {
        outcome: {
          outcomeType,
          otherEnforcementAction,
          updateEnforcementAction,
        },
      },
    },
  },
})

const mockReq = ({
  id = uuid,
  request = {},
  outcomeType = 'ATTENDED_COMPLIED',
  otherEnforcementAction = null,
  updateEnforcementAction = null,
}: {
  id?: string
  request?: Record<string, any>
  outcomeType?: AppointmentOutcomeType
  otherEnforcementAction?: AppointmentEnforcementAction
  updateEnforcementAction?: AppointmentEnforcementAction
}): httpMocks.MockRequest<any> => {
  const req = {
    body: appointment(id, outcomeType, otherEnforcementAction, updateEnforcementAction),
    session: {
      data: appointment(id, outcomeType, otherEnforcementAction, updateEnforcementAction),
    },
    ...request,
  }
  return httpMocks.createRequest(req)
}

const mockRes = (appointmentOutcome: Partial<AppointmentOutcomeProps<Activity>> = {}): httpMocks.MockResponse<any> => {
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

describe('/middleware/appointment-outcomes/getBackLink', () => {
  const checkBackLinks = ({
    arrangeAppointmentJourney = true,
    requestMethod,
  }: {
    arrangeAppointmentJourney?: boolean
    requestMethod: 'GET' | 'POST'
  }) => {
    const request = requestMethod === 'GET' ? { body: {} } : { session: {} }

    const localsVars = arrangeAppointmentJourney ? { uuid, id: uuid } : { id: contactId, contactId }

    it('should return correct link if on outcome page', () => {
      const req = mockReq({ request, id: arrangeAppointmentJourney ? uuid : contactId })
      const res = mockRes({ reqUrl: baseOutcomeUrl, ...localsVars })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(
        arrangeAppointmentJourney ? `${baseUrl}/location-date-time` : `${baseUrl}/manage`,
      )
    })
    it('should return correct link if on attended complied page', () => {
      const req = mockReq({ request, id: arrangeAppointmentJourney ? uuid : contactId })
      const res = mockRes({ reqUrl: `${baseOutcomeUrl}/attended-complied`, ...localsVars })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(baseOutcomeUrl)
    })
    it('should return correct link if on attended failed to comply page', () => {
      const req = mockReq({ request, id: arrangeAppointmentJourney ? uuid : contactId })
      const res = mockRes({ reqUrl: `${baseOutcomeUrl}/attended-failed-to-comply`, ...localsVars })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(baseOutcomeUrl)
    })
    it('should return correct link if on acceptable absence page', () => {
      const req = mockReq({ request, id: arrangeAppointmentJourney ? uuid : contactId })
      const res = mockRes({ reqUrl: `${baseOutcomeUrl}/acceptable-absence`, ...localsVars })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(baseOutcomeUrl)
    })
    it('should return correct link if on unacceptable absence page', () => {
      const req = mockReq({ request, id: arrangeAppointmentJourney ? uuid : contactId })
      const res = mockRes({ reqUrl: `${baseOutcomeUrl}/unacceptable-absence`, ...localsVars })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(baseOutcomeUrl)
    })
    it('should return correct link if on failed to attend page', () => {
      const req = mockReq({ request, id: arrangeAppointmentJourney ? uuid : contactId })
      const res = mockRes({ reqUrl: `${baseOutcomeUrl}/failed-to-attend`, ...localsVars })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(baseOutcomeUrl)
    })

    it('should return the correct link if on send letter page and other enforcement action has been set', () => {
      const req = mockReq({
        request,
        id: arrangeAppointmentJourney ? uuid : contactId,
        outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
        otherEnforcementAction: 'BREACH_LETTER_SENT',
      })
      const res = mockRes({ reqUrl: `${baseOutcomeUrl}/send-letter`, ...localsVars })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/enforcement-action`)
    })

    it('should return the correct link if on send letter page and update enforcement action has been set', () => {
      const req = mockReq({
        request,
        id: arrangeAppointmentJourney ? uuid : contactId,
        outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
        updateEnforcementAction: 'SEND_ANOTHER_LETTER',
      })
      const res = mockRes({ reqUrl: `${baseOutcomeUrl}/send-letter`, ...localsVars })
      getBackLink(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.backLink).toEqual(`${baseOutcomeUrl}/update-enforcement-action`)
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
          const req = mockReq({ id: arrangeAppointmentJourney ? uuid : contactId, outcomeType: type, request })
          const res = mockRes({ reqUrl: `${baseOutcomeUrl}/${pageUrl}`, ...localsVars })
          getBackLink(req, res, nextSpy)
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
