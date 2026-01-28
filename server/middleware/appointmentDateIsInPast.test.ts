import { DateTime } from 'luxon'
import httpMocks, { RequestMethod } from 'node-mocks-http'
import { AppointmentSession } from '../models/Appointments'
import { appointmentDateIsInPast } from './appointmentDateIsInPast'
import { getDataValue } from '../utils'

const crn = 'X000001'
const id = 'b5719245-0f0a-4bbc-bbef-2d6a095e39f7'

const mockAppointment: AppointmentSession = {
  user: {
    username: 'user-1',
    teamCode: 'mock-team-code',
    locationCode: 'mock-location-code',
  },
  eventId: '1',
  type: 'C084',
  date: '2044-12-22T09:15:00.382936Z[Europe/London]',
  start: '2044-12-22T09:15:00.382936Z[Europe/London]',
  end: '2044-12-22T09:15:00.382936Z[Europe/London]',
  sensitivity: 'Yes',
  outcomeRecorded: 'Yes',
}

const buildRequest = ({
  request,
  appointment,
  method,
  body,
}: {
  method?: RequestMethod
  request?: Record<string, string>
  appointment?: Record<string, string>
  body?: Record<string, any>
}): httpMocks.MockRequest<any> => {
  const req = {
    method: method ?? 'POST',
    params: {
      crn,
      id,
    },
    body: {
      ...body,
    },
    session: {
      data: {
        appointments: {
          [crn]: {
            [id]: {
              ...mockAppointment,
              ...(appointment ?? {}),
            },
          },
        },
      },
    },
    ...(request ?? {}),
  }
  return httpMocks.createRequest(req)
}

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    getDataValue: jest.fn(),
  }
})

const res = httpMocks.createResponse()

const mockGetDataValue = getDataValue as jest.MockedFunction<typeof getDataValue>

const now = DateTime.now()
const date = now.plus({ days: 1 }).toFormat('d/M/yyyy')

describe('/middleware/appointmentDateIsInPast()', () => {
  it('should return true if post request and date in past is in request body', () => {
    const req = buildRequest({
      body: {
        appointments: {
          [crn]: {
            [id]: {
              date: '9/8/2025',
              start: '10:00',
              end: '10:30',
            },
          },
        },
      },
    })
    expect(appointmentDateIsInPast(req, res)).toEqual(true)
  })

  it('should return false if post request and date in future is in request body', () => {
    const req = buildRequest({
      body: {
        appointments: {
          [crn]: {
            [id]: {
              date,
              start: '10:00',
              end: '10:30',
            },
          },
        },
      },
    })
    expect(appointmentDateIsInPast(req, res)).toEqual(false)
  })
  it('should return true if not post request and past date set in appointment session', () => {
    const req = buildRequest({ method: 'GET', appointment: { date: '2025-08-09', start: '10:00', end: '10:30' } })
    mockGetDataValue.mockReturnValueOnce(req.session.data.appointments[crn][id])
    expect(appointmentDateIsInPast(req, res)).toEqual(true)
  })
  it('should return false if not post request and future date set in appointment session', () => {
    const req = buildRequest({ method: 'GET', appointment: { date, start: '10:00', end: '10:30' } })
    mockGetDataValue.mockReturnValueOnce(req.session.data.appointments[crn][id])
    expect(appointmentDateIsInPast(req, res)).toEqual(false)
  })
  it('should return false if not post request and no date set in appointment session', () => {
    const req = buildRequest({ method: 'GET', appointment: { date: '', start: '', end: '' } })
    mockGetDataValue.mockReturnValueOnce(req.session.data.appointments[crn][id])
    expect(appointmentDateIsInPast(req, res)).toEqual(false)
  })
})
