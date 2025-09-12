import httpMocks from 'node-mocks-http'
import { AppointmentSession } from '../models/Appointments'
import { AppResponse } from '../models/Locals'
import { setDataValue } from '../utils'
import { cloneAppointmentAndRedirect } from './cloneAppointmentAndRedirect'

const uuid = 'f1654ea3-0abb-46eb-860b-654a96edbe20'

jest.mock('uuid', () => ({
  v4: jest.fn(() => uuid),
}))

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    setDataValue: jest.fn(),
  }
})

// const mockedUuidv4 = uuidv4 as jest.Mock
const mockedSetDataValue = setDataValue as jest.MockedFunction<typeof setDataValue>

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

function setup(clearType = false) {
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
  const { req, res } = setup()
  const { crn } = req.params
  const redirectSpy = jest.spyOn(res, 'redirect')

  it('should construct the correct session with date removed', () => {
    cloneAppointmentAndRedirect(mockAppt)(req, res)
    const expectedClone = {
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
    }
    expect(mockedSetDataValue).toHaveBeenCalledWith(req.session.data, ['appointments', crn, uuid], expectedClone)
    expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/arrange-another-appointment`)
  })

  it('should construct the correct session with date and type removed', () => {
    cloneAppointmentAndRedirect(mockAppt, { clearType: true })(req, res)
    const expectedClone = {
      ...mockAppt,
      type: '',
      date: '',
      start: '',
      end: '',
      repeatingDates: [] as string[],
      until: '',
      numberOfAppointments: '1',
      numberOfRepeatAppointments: '0',
      repeating: 'No',
      uuid,
    }
    expect(mockedSetDataValue).toHaveBeenCalledWith(req.session.data, ['appointments', crn, uuid], expectedClone)
    expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/arrange-another-appointment`)
  })
})
