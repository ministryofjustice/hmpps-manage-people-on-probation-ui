import httpMocks from 'node-mocks-http'
import { AppointmentSession, AppointmentType } from '../models/Appointments'
import { AppointmentLocals, AppResponse } from '../models/Locals'
import { getDataValue } from '../utils'
import { checkAnswers } from './checkAnswers'
import { Location } from '../data/model/caseload'

const nextSpy = jest.fn()
const mockAppointmentSessions = [
  {
    user: {
      locationCode: 'N56NTMC',
    },
    type: 'COAP',
    eventId: '',
  },
  {
    user: {
      locationCode: 'N56NTMC',
    },
    type: 'COAP',
    eventId: 'PERSON_LEVEL_CONTACT',
  },
  {
    user: {
      locationCode: 'NO_LOCATION_REQUIRED',
    },
    type: 'COAP',
    eventId: '',
  },
]
const mockUserLocations: Location[] = [
  {
    id: 1234,
    code: 'N56NTMC',
    description: 'HMP Wakefield',
    address: {
      buildingNumber: '5',
      streetName: 'Love Lane',
      town: 'Wakefield',
      county: 'West Yorkshire',
      postcode: 'WF2 9AG',
    },
  },
]

const mockAppointmentTypes: AppointmentType[] = [
  {
    code: 'COAP',
    description: 'Home visit to case (NS)',
    isPersonLevelContact: false,
    isLocationRequired: true,
  },
  {
    code: 'COAI',
    description: 'Initial appointment - In office (NS)',
    isPersonLevelContact: false,
    isLocationRequired: true,
  },
  {
    code: 'COPT',
    description: 'Planned telephone contact (NS)',
    isPersonLevelContact: true,
    isLocationRequired: true,
  },
]

const mockAppointments = [
  {
    meta: {
      hasLocation: true,
    },
    type: {
      code: 'COAP',
      isLocationRequired: true,
    },
    location: {
      id: 1234,
      code: 'N56NTMC',
    },
  },
  {
    meta: {
      hasLocation: true,
    },
    type: {
      code: 'COAP',
      isLocationRequired: true,
    },
    location: {
      id: 1234,
      code: 'N56NTMC',
    },
  },
  {
    meta: {
      hasLocation: true,
    },
    type: {
      code: 'COAP',
      isLocationRequired: true,
    },
    location: {
      id: 1234,
      code: 'N56NTMC',
    },
  },
]

function setup(session: any, appt: any) {
  const req = httpMocks.createRequest({
    params: {
      crn: 'X000001',
      id: 1,
    },
    session: {
      data: {
        appointments: {
          X000001: {
            1: session,
          },
        },
      },
    },
  })
  const res = {
    locals: {
      appointmentTypes: mockAppointmentTypes,
      userLocations: mockUserLocations,
      appointment: appt,
    },
    redirect: jest.fn().mockReturnThis(),
  } as unknown as AppResponse

  return { req, res }
}

describe('/middleware/checkAnswers', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('no changes are made to a valid appointment session', () => {
    const { req, res } = setup(mockAppointmentSessions[0], mockAppointments[0])
    const { data } = req.session
    const { crn, id } = req.params
    checkAnswers(req, res, nextSpy)
    const session = getDataValue(data, ['appointments', crn, id])
    expect(session.type).toEqual('COAP')
    expect(session.user.locationCode).toEqual('N56NTMC')
  })
  it('remove type and location if not a valid type', () => {
    const { req, res } = setup(mockAppointmentSessions[1], mockAppointments[1])
    const { data } = req.session
    const { crn, id } = req.params
    checkAnswers(req, res, nextSpy)
    const session = getDataValue(data, ['appointments', crn, id])
    expect(session.type).toEqual(null)
    expect(session.user.locationCode).toEqual(null)
  })
  it('remove location if not valid', () => {
    const { req, res } = setup(mockAppointmentSessions[2], mockAppointments[2])
    const { data } = req.session
    const { crn, id } = req.params
    checkAnswers(req, res, nextSpy)
    const session = getDataValue(data, ['appointments', crn, id])
    expect(session.type).toEqual('COAP')
    expect(session.user.locationCode).toEqual(null)
  })
})
