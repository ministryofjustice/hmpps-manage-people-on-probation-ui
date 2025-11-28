import httpMocks from 'node-mocks-http'
import { getAttendedCompliedProps } from './getAttendedCompliedProps'
import { mockAppResponse } from '../controllers/mocks'
import { getDataValue } from '../utils'

const contactId = '12345'
const crn = 'X000001'
const id = 'b5719245-0f0a-4bbc-bbef-2d6a095e39f7'
const forename = 'James'
const surname = 'Morrison'
const type = '3 Way Meeting (NS)'
const officerForename = 'John'
const officerSurname = 'Smith'
const startDateTime = '2025-10-11'

const buildRequest = (params?: Record<string, string>): httpMocks.MockRequest<any> => {
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
              date: startDateTime,
            },
          },
        },
      },
    },
  }
  return httpMocks.createRequest(req)
}

const buildResponse = (): httpMocks.MockResponse<any> => {
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
        type,
        officer: {
          name: {
            forename: officerForename,
            surname: officerSurname,
          },
        },
        startDateTime,
      },
    },
    appointment: {
      type: {
        description: type,
      },
      attending: {
        name: `${officerForename} ${officerSurname}`,
      },
    },
  }
  return mockAppResponse(locals)
}

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    getDataValue: jest.fn(),
  }
})

const mockGetDataValue = getDataValue as jest.MockedFunction<typeof getDataValue>

const res = buildResponse()

describe('/middleware/getAttendedCompliedProps()', () => {
  const expectedAppointment = {
    type,
    officer: {
      name: {
        forename: officerForename,
        surname: officerSurname,
      },
    },
    startDateTime,
  }
  it('should construct the appointment from res.locals.personAppointment if contactId in url', () => {
    const req = buildRequest()
    expect(getAttendedCompliedProps(req, res)).toStrictEqual({
      forename,
      surname,
      appointment: expectedAppointment,
    })
  })
  it('should construct the appointment from res.locals.appointment ans session if contactId not in url', () => {
    const req = buildRequest({ contactId: undefined })
    mockGetDataValue.mockReturnValueOnce(req.session.data.appointments[crn][id])
    expect(getAttendedCompliedProps(req, res)).toStrictEqual({
      forename,
      surname,
      appointment: expectedAppointment,
    })
  })
})
