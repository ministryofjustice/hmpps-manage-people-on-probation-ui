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
  notes: null,
  sensitivity: null,
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
  const { req, res } = setup()
  const { crn } = req.params
  const redirectSpy = jest.spyOn(res, 'redirect')

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

  it('should construct the correct session with date removed and redirect to arrange another appointment page', () => {
    cloneAppointmentAndRedirect(mockAppt)(req, res)
    expect(mockedSetDataValue).toHaveBeenCalledWith(req.session.data, ['appointments', crn, uuid], expectedClone)
    expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/arrange-another-appointment`)
  })

  it('should reuse existing id and redirect to reschedule check answers when apptType is RESCHEDULE', () => {
    const { req: request, res: response } = setup()
    const crn2 = request.params.crn
    request.params.id = 'APPT123'
    request.params.contactId = 'C9876'
    const redirectSpy2 = jest.spyOn(response, 'redirect')

    const expectedCloneReschedule = {
      ...expectedClone,
      uuid: request.params.id,
    }

    cloneAppointmentAndRedirect(mockAppt, 'RESCHEDULE')(request, response)

    expect(mockedSetDataValue).toHaveBeenCalledWith(
      request.session.data,
      ['appointments', crn2, request.params.id],
      expectedCloneReschedule,
    )
    expect(redirectSpy2).toHaveBeenCalledWith(
      `/case/${crn2}/appointments/reschedule/${request.params.contactId}/${request.params.id}/check-answers`,
    )
  })
})
