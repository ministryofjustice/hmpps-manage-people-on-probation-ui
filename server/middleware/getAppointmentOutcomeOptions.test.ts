import { DateTime } from 'luxon'
import httpMocks from 'node-mocks-http'
import { getAppointmentOutcomeOptions } from './getAppointmentOutcomeOptions'
import { mockAppResponse } from '../controllers/mocks'
import { appointmentDateIsInPast } from './appointmentDateIsInPast'

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
const now = DateTime.now()
const futureDate = now.plus({ day: 1 }).toFormat('yyyy-MM-dd')

const nextSpy = jest.fn()

const buildRequest = ({ params = {}, date = pastDate, id = uuid, type = 'COPT' } = {}): httpMocks.MockRequest<any> => {
  const req = {
    params: {
      contactId,
      crn,
      id,
      ...params,
    },
    session: {
      data: {
        appointments: {
          [crn]: {
            [id]: {
              date,
              start,
              end,
              type,
            },
          },
        },
      },
    },
  }
  return httpMocks.createRequest(req)
}

const buildResponse = ({
  date = pastDate,
  time = start,
  type = 'COAI',
  isInPast = true,
} = {}): httpMocks.MockResponse<any> => {
  const locals = {
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
    appointmentOutcome: {
      isInPast,
      appointmentSession: {
        type,
      },
    },
  }
  return mockAppResponse(locals)
}

jest.mock('./appointmentDateIsInPast', () => ({
  appointmentDateIsInPast: jest.fn(),
}))

const mockAppointmentDateIsInPast = appointmentDateIsInPast as jest.MockedFunction<typeof appointmentDateIsInPast>

describe('/middleware/getAppointmentOutcomeOptions()', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return the correct values if manage appointment journey and appointment in the past and appointment type is non office based', () => {
    const req = buildRequest({ params: { id: undefined }, id: contactId })
    const res = buildResponse({ type: 'COPT' })
    mockAppointmentDateIsInPast.mockReturnValue(true)
    getAppointmentOutcomeOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'ATTENDED' }),
        expect.objectContaining({ value: 'ATTENDED_DID_NOT_FOLLOW_INSTRUCTIONS' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE' }),
        expect.objectContaining({ value: 'UNACCEPTABLE_ABSENCE' }),
        expect.objectContaining({ value: 'EVIDENCE_REQUESTED' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(5)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })

  it('should return the correct values if manage appointment journey and appointment in the past and appointment type is office based', () => {
    const req = buildRequest({ params: { id: undefined }, id: contactId, type: 'COAI' })
    const res = buildResponse()
    mockAppointmentDateIsInPast.mockReturnValue(true)
    getAppointmentOutcomeOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'ATTENDED' }),
        expect.objectContaining({ value: 'ATTENDED_SENT_HOME_BEHAVIOUR' }),
        expect.objectContaining({ value: 'ATTENDED_SENT_HOME_PROBATION_SERVICE_ISSUES' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE' }),
        expect.objectContaining({ value: 'UNACCEPTABLE_ABSENCE' }),
        expect.objectContaining({ value: 'EVIDENCE_REQUESTED' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(6)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })

  it('should return the correct values if manage appointment journey and appointment in the future', () => {
    const req = buildRequest({ params: { id: undefined }, date: futureDate, id: contactId })
    const res = buildResponse({ date: futureDate, isInPast: false })
    mockAppointmentDateIsInPast.mockReturnValue(false)
    getAppointmentOutcomeOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE' }),
        expect.objectContaining({ value: 'WILL_BE_RESCHEDULED' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(2)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })

  it('should return the correct values if arrange appointment journey and appointment in the past and appointment type is non office based', () => {
    const req = buildRequest({ params: { contactId: undefined, id: uuid }, id: uuid })
    const res = buildResponse({ type: 'COPT' })
    mockAppointmentDateIsInPast.mockReturnValue(true)
    getAppointmentOutcomeOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'ATTENDED' }),
        expect.objectContaining({ value: 'ATTENDED_DID_NOT_FOLLOW_INSTRUCTIONS' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE' }),
        expect.objectContaining({ value: 'UNACCEPTABLE_ABSENCE' }),
        expect.objectContaining({ value: 'EVIDENCE_REQUESTED' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(5)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })

  it('should return the correct values if arrange appointment journey and appointment in the past and appointment type is office based', () => {
    const req = buildRequest({ params: { contactId: undefined, id: uuid }, id: uuid })
    const res = buildResponse()
    mockAppointmentDateIsInPast.mockReturnValue(true)
    getAppointmentOutcomeOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'ATTENDED' }),
        expect.objectContaining({ value: 'ATTENDED_SENT_HOME_BEHAVIOUR' }),
        expect.objectContaining({ value: 'ATTENDED_SENT_HOME_PROBATION_SERVICE_ISSUES' }),
        expect.objectContaining({ value: 'ACCEPTABLE_ABSENCE' }),
        expect.objectContaining({ value: 'UNACCEPTABLE_ABSENCE' }),
        expect.objectContaining({ value: 'EVIDENCE_REQUESTED' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(6)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
