import httpMocks from 'node-mocks-http'
import { AppointmentSession } from '../models/Appointments'
import { AppResponse } from '../models/Locals'
import { getDataValue } from '../utils'
import { cloneAppointmentAndRedirect } from './cloneAppointmentAndRedirect'

const mockAppt: AppointmentSession = {
  user: {
    providerCode: 'N07',
    teamCode: 'N07CHT',
    username: 'tony-pan',
    locationCode: 'N56NTME',
  },
  type: 'COAP',
  visorReport: 'Yes',
  date: '2024-02-21T10:15:00.382936Z[Europe/London]',
  start: '2024-02-21T10:15:00.382936Z[Europe/London]',
  end: '2024-02-21T10:30:00.382936Z[Europe/London]',
  until: '2024-02-21T10:30:00.382936Z[Europe/London]',
  interval: 'DAY',
  numberOfAppointments: '1',
  numberOfRepeatAppointments: '0',
  eventId: '2501192724',
  username: 'USER1',
  uuid: '',
  repeating: 'No',
  repeatingDates: [],
  notes: 'Some notes',
  sensitivity: 'No',
  licenceConditionId: '80',
}

function setup() {
  const req = httpMocks.createRequest({
    params: {
      crn: 'X000001',
    },
    session: {
      data: {
        appointments: {
          X000001: {},
        },
      },
    },
  })
  const res = {
    locals: {},
    redirect: jest.fn().mockReturnThis(),
  } as unknown as AppResponse

  return { req, res }
}

describe('/middleware/cloneAppointmentAndRedirect', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should construct the correct session with date and type removed when requested', () => {
    const { req, res } = setup()
    const clearType = true
    cloneAppointmentAndRedirect(mockAppt, { clearType })(req, res)
    const uuid = Object.keys(getDataValue(req.session.data, ['appointments', req.params.crn]))[0]
    const result = getDataValue(req.session.data, ['appointments', req.params.crn, uuid])
    expect(result).toEqual({
      ...mockAppt,
      date: '',
      start: '',
      end: '',
      repeatingDates: [] as string[],
      until: '',
      numberOfAppointments: '1',
      numberOfRepeatAppointments: '0',
      repeating: 'No',
      type: '',
      uuid,
    })
  })

  it('should construct the correct session with date removed by default', () => {
    const { req, res } = setup()
    cloneAppointmentAndRedirect(mockAppt)(req, res)
    const uuid = Object.keys(getDataValue(req.session.data, ['appointments', req.params.crn]))[0]
    const result = getDataValue(req.session.data, ['appointments', req.params.crn, uuid])
    expect(result).toEqual({
      ...mockAppt,
      date: '',
      start: '',
      end: '',
      repeatingDates: [] as string[],
      until: '',
      numberOfAppointments: '1',
      numberOfRepeatAppointments: '0',
      repeating: 'No',
      uuid,
    })
  })
})
