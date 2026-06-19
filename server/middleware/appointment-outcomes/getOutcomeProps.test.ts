import { DateTime } from 'luxon'
import httpMocks from 'node-mocks-http'
import { getOutcomeProps } from './getOutcomeProps'
import { mockAppResponse, probationPractitioner as mockProbationPractitioner } from '../../controllers/mocks'
import { appointmentDateIsInPast } from '../appointmentDateIsInPast'
import { Sentence } from '../../data/model/sentenceDetails'

const contactId = '12345'
const crn = 'X000001'
const uuid = 'b5719245-0f0a-4bbc-bbef-2d6a095e39f7'
const forename = 'James'
const surname = 'Morrison'
const typeDescription = '3 Way Meeting (NS)'
const officerForename = 'John'
const officerSurname = 'Smith'
const pastDate = '2025-10-11'
const start = '09:00'
const end = '10:00'
const url = '/mock/url'
const nextSpy = jest.fn()

const mockSentences = (endDate: string): Sentence[] => [
  {
    id: 49,
    eventNumber: '1234567',
    order: {
      description: 'Pre-Sentence',
      sentenceType: 'CUSTODY',
      startDate: '2025-05-31',
      endDate,
    },
    nsis: [],
    licenceConditions: [],
    requirements: [],
  },
  {
    id: 48,
    eventNumber: '7654321',
    order: {
      description: 'Pre-Sentence',
      sentenceType: 'COMMUNITY',
      startDate: '2025-05-31',
      endDate,
    },
    nsis: [],
    licenceConditions: [],
    requirements: [],
  },
]
jest.mock('../renderError', () => ({
  renderError: jest.fn(),
}))

const buildRequest = ({
  params = {},
  date = pastDate,
  id = uuid,
  type = 'COPT',
  eventId = '48',
  sentenceEndDate = '2026-05-31',
} = {}): httpMocks.MockRequest<any> => {
  const req = {
    params: {
      contactId,
      crn,
      id,
      ...params,
    },
    url,
    session: {
      data: {
        sentences: {
          [crn]: mockSentences(sentenceEndDate),
        },
        appointments: {
          [crn]: {
            [id]: {
              date,
              start,
              end,
              type,
              eventId,
            },
          },
        },
        personalDetails: {
          [crn]: {
            probationPractitioner: mockProbationPractitioner,
          },
        },
      },
    },
  }
  return httpMocks.createRequest(req)
}

const buildResponse = ({ date = pastDate, time = start, username = 'user-1' } = {}): httpMocks.MockResponse<any> => {
  const locals = {
    user: { username },
    case: {
      name: {
        forename,
        surname,
      },
    },
    personAppointment: {
      personSummary: {
        crn,
        name: {
          forename,
          surname,
        },
      },
      appointment: {
        type: typeDescription,
        officer: {
          name: {
            forename: officerForename,
            surname: officerSurname,
          },
        },
        startDateTime: `${date}T${time}:00Z`,
      },
    },
    appointment: {
      type: {
        description: typeDescription,
      },
      attending: {
        name: `${officerForename} ${officerSurname}`,
      },
    },
  }
  return mockAppResponse(locals)
}

jest.mock('../../utils', () => {
  const actualUtils = jest.requireActual('../../utils')
  return {
    ...actualUtils,
    getDataValue: jest.fn(),
  }
})

jest.mock('../appointmentDateIsInPast', () => ({
  appointmentDateIsInPast: jest.fn(),
}))

const mockAppointmentDateIsInPast = appointmentDateIsInPast as jest.MockedFunction<typeof appointmentDateIsInPast>

describe('/middleware/appointment-outcomes/getOutcomeProps()', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('Arrange appointment journey', () => {
    it('should add the correct values to res.locals.appointmentOutcome', () => {
      const req = buildRequest({ params: { contactId: undefined } })
      const res = buildResponse()
      mockAppointmentDateIsInPast.mockReturnValueOnce(true)
      jest.spyOn(DateTime.prototype, 'toISO').mockImplementation(() => '2025-10-11T09:00:00Z')
      getOutcomeProps(req, res, nextSpy)
      expect(res.locals.appointmentOutcome).toEqual(
        expect.objectContaining({
          forename,
          surname,
          appointment: res.locals.personAppointment.appointment,
          crn,
          uuid,
          contactId: undefined,
          id: uuid,
          isValidParams: true,
          isInPast: true,
          reqUrl: url,
          baseUrl: `/case/${crn}/arrange-appointment/${uuid}`,
          baseOutcomeUrl: `/case/${crn}/arrange-appointment/${uuid}/outcome`,
          completedUrl: `/case/${crn}/arrange-appointment/${uuid}/check-your-answers`,
          appointmentSession: req.session.data.appointments[crn][uuid],
          appointmentHintText: 'Appointment: 3 way meeting (NS) with John Smith on Saturday 11 October 2025.',
          isProbationPractitioner: false,
        }),
      )

      expect(nextSpy).toHaveBeenCalledTimes(1)
    })

    it('should add the correct values to res.locals.appointmentOutcome if user is probation practitioner and sentence type is CUSTODY and sentence length is 24 months', () => {
      const req = buildRequest({ params: { contactId: undefined }, eventId: '49', sentenceEndDate: '2027-05-31' })
      const res = buildResponse({ username: 'DeborahFern' })
      mockAppointmentDateIsInPast.mockReturnValueOnce(true)
      jest.spyOn(DateTime.prototype, 'toISO').mockImplementation(() => '2025-10-11T09:00:00Z')
      getOutcomeProps(req, res, nextSpy)
      expect(res.locals.appointmentOutcome).toEqual(
        expect.objectContaining({
          forename,
          surname,
          appointment: res.locals.personAppointment.appointment,
          crn,
          uuid,
          contactId: undefined,
          id: uuid,
          isValidParams: true,
          isInPast: true,
          reqUrl: url,
          baseUrl: `/case/${crn}/arrange-appointment/${uuid}`,
          baseOutcomeUrl: `/case/${crn}/arrange-appointment/${uuid}/outcome`,
          completedUrl: `/case/${crn}/arrange-appointment/${uuid}/check-your-answers`,
          appointmentSession: req.session.data.appointments[crn][uuid],
          appointmentHintText: 'Appointment: 3 way meeting (NS) with John Smith on Saturday 11 October 2025.',
          isProbationPractitioner: true,
        }),
      )
    })

    it('should set the probation practitioner as true if logged in username matches PP username but case format is different', () => {
      const req = buildRequest({ params: { contactId: undefined }, eventId: '49', sentenceEndDate: '2027-05-31' })
      const res = buildResponse({ username: 'deborahfern' })
      mockAppointmentDateIsInPast.mockReturnValueOnce(true)
      jest.spyOn(DateTime.prototype, 'toISO').mockImplementation(() => '2025-10-11T09:00:00Z')
      getOutcomeProps(req, res, nextSpy)
      expect(res.locals.appointmentOutcome).toEqual(
        expect.objectContaining({
          forename,
          surname,
          appointment: res.locals.personAppointment.appointment,
          crn,
          uuid,
          contactId: undefined,
          id: uuid,
          isValidParams: true,
          isInPast: true,
          reqUrl: url,
          baseUrl: `/case/${crn}/arrange-appointment/${uuid}`,
          baseOutcomeUrl: `/case/${crn}/arrange-appointment/${uuid}/outcome`,
          completedUrl: `/case/${crn}/arrange-appointment/${uuid}/check-your-answers`,
          appointmentSession: req.session.data.appointments[crn][uuid],
          appointmentHintText: 'Appointment: 3 way meeting (NS) with John Smith on Saturday 11 October 2025.',
          isProbationPractitioner: true,
        }),
      )
    })

    it('should set the probation practitioner as true if logged in username matches PP username but case format is different', () => {
      const req = buildRequest({ params: { contactId: undefined }, eventId: '49', sentenceEndDate: '2027-05-31' })
      const res = buildResponse({ username: 'deborahfern' })
      mockAppointmentDateIsInPast.mockReturnValueOnce(true)
      jest.spyOn(DateTime.prototype, 'toISO').mockImplementation(() => '2025-10-11T09:00:00Z')
      getOutcomeProps(req, res, nextSpy)
      expect(res.locals.appointmentOutcome).toEqual(
        expect.objectContaining({
          forename,
          surname,
          appointment: res.locals.personAppointment.appointment,
          crn,
          uuid,
          contactId: undefined,
          id: uuid,
          isValidParams: true,
          isInPast: true,
          documents: [],
          linkedContactId: null,
          sendBreachOrRecallLetter: false,
          sendLetter: false,
          reqUrl: url,
          baseUrl: `/case/${crn}/arrange-appointment/${uuid}`,
          baseOutcomeUrl: `/case/${crn}/arrange-appointment/${uuid}/outcome`,
          completedUrl: `/case/${crn}/arrange-appointment/${uuid}/check-your-answers`,
          appointmentSession: req.session.data.appointments[crn][uuid],
          appointmentHintText: 'Appointment: 3 way meeting (NS) with John Smith on Saturday 11 October 2025.',
          isProbationPractitioner: true,
        }),
      )
    })
  })
  describe('Manage appointment journey', () => {
    it('should add the correct values to res.locals.appointmentOutcome', () => {
      const req = buildRequest({ id: contactId, params: { id: undefined } })
      const res = buildResponse()
      mockAppointmentDateIsInPast.mockReturnValueOnce(false)
      jest.spyOn(DateTime.prototype, 'toISO').mockImplementation(() => '2025-10-11T09:00:00Z')
      getOutcomeProps(req, res, nextSpy)
      expect(res.locals.appointmentOutcome).toEqual(
        expect.objectContaining({
          forename,
          surname,
          appointment: res.locals.personAppointment.appointment,
          crn,
          uuid: undefined,
          contactId,
          id: contactId,
          isValidParams: true,
          isInPast: false,
          reqUrl: url,
          baseUrl: `/case/${crn}/appointments/appointment/${contactId}`,
          baseOutcomeUrl: `/case/${crn}/appointments/appointment/${contactId}/outcome`,
          completedUrl: `/case/${crn}/appointments/appointment/${contactId}/manage`,
          appointmentHintText: 'Appointment: 3 way meeting (NS) with John Smith on Saturday 11 October 2025.',
          appointmentSession: req.session.data.appointments[crn][contactId],
          isProbationPractitioner: false,
        }),
      )
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  it('should set sendLetter to true when failedToAttend is SEND_LETTER', () => {
    const req = buildRequest({ params: { contactId: undefined } })

    req.session.data.appointments[crn][uuid].outcome = {
      failedToAttend: 'SEND_LETTER',
    }

    const res = buildResponse()

    mockAppointmentDateIsInPast.mockReturnValueOnce(true)
    jest.spyOn(DateTime.prototype, 'toISO').mockImplementation(() => '2025-10-11T09:00:00Z')

    getOutcomeProps(req, res, nextSpy)

    expect(res.locals.appointmentOutcome.sendLetter).toBe(true)
  })

  it('should set sendBreachOrRecallLetter to true when outcome contains BREACH_RECALL_INITIATED_AND_SEND_LETTER', () => {
    const req = buildRequest({ params: { contactId: undefined } })

    req.session.data.appointments[crn][uuid].outcome = {
      attendedFailedToComply: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
    }

    const res = buildResponse()

    mockAppointmentDateIsInPast.mockReturnValueOnce(true)
    jest.spyOn(DateTime.prototype, 'toISO').mockImplementation(() => '2025-10-11T09:00:00Z')

    getOutcomeProps(req, res, nextSpy)

    expect(res.locals.appointmentOutcome.sendBreachOrRecallLetter).toBe(true)
  })
})
