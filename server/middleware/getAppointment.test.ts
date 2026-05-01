import httpMocks from 'node-mocks-http'
import { getAppointment } from './getAppointment'
import { AppResponse } from '../models/Locals'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import { Overview } from '../data/model/overview'
import { AppointmentSession, AppointmentType } from '../models/Appointments'
import { Sentence } from '../data/model/sentenceDetails'

const crn = 'X000001'

const mockAppt: AppointmentSession = {
  type: 'COAP',
  eventId: '12345',
  user: {
    locationCode: 'NE5',
    teamCode: 'NE5TTT',
    username: 'user-1',
  },
  date: '2044-12-22T09:15:00.382936Z[Europe/London]',
  start: '2044-12-22T09:15:00.382936Z[Europe/London]',
  end: '2044-12-22T09:15:00.382936Z[Europe/London]',
  smsOptIn: 'YES',
  rescheduleAppointment: {
    previousStart: '',
    previousEnd: '',
  },
}

const username = 'user-1'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/masApiClient')

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
  }
})

const mockOverview = {
  personalDetails: {
    name: {
      forename: 'Joe',
      surname: 'Bloggs',
    },
  },
  registrations: ['Restraining Order', 'Domestic Abuse Perpetrator', 'Risk to Known Adult'],
} as unknown as Overview

const nextSpy = jest.fn()
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>

const mockTypes: AppointmentType[] = [
  {
    code: 'COAP',
    description: 'Planned Office Visit (NS)',
    isPersonLevelContact: false,
    isLocationRequired: true,
  },
  {
    code: 'COPT',
    description: 'Planned Telephone Contact (NS)',
    isPersonLevelContact: false,
    isLocationRequired: false,
  },
]

const mockSentences = [
  {
    id: 12345,
    mainOffence: {
      code: '18502',
      description: 'Breach of Restraining Order (Protection from Harassment Act 1997) - 00831',
    },
    order: {
      description: '12 month Community order',
      endDate: '2024-12-01',
      startDate: '2023-12-01',
    },
  },
] as unknown as Sentence[]

describe('/middleware/getAppointment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should assign appointment to locals var if found in session', async () => {
    const getOverviewSpy = jest
      .spyOn(MasApiClient.prototype, 'getOverview')
      .mockImplementation(() => Promise.resolve(mockOverview))

    const req = httpMocks.createRequest({
      params: {
        crn,
        id: '100',
      },
      session: {
        data: {
          appointments: {
            [crn]: {
              '100': mockAppt,
            },
          },
          appointmentTypes: mockTypes,
          sentences: {
            [crn]: mockSentences,
          },
          providers: {
            [username]: [],
          },
          teams: {
            [username]: [],
          },
          staff: {
            [username]: [],
          },
        },
      },
    })
    const res = {
      locals: {
        user: {
          username,
        },
        attendingUser: {
          staffCode: '',
          homeArea: '',
          team: '',
          username: '',
        },
      },
      redirect: jest.fn().mockReturnThis(),
    } as unknown as AppResponse
    await getAppointment(hmppsAuthClient)(req, res, nextSpy)
    expect(res.locals.appointment).toStrictEqual({
      meta: {
        isVisor: false,
        forename: 'Joe',
        change: null,
        userIsAttending: true,
        hasLocation: true,
      },
      type: {
        code: 'COAP',
        description: 'Planned Office Visit (NS)',
        isLocationRequired: true,
        isPersonLevelContact: false,
      },
      visorReport: null,
      appointmentFor: {
        sentence: '12 month Community order',
        requirement: null,
        licenceCondition: null,
        nsi: null,
        forename: null,
        mobileNumber: '',
      },
      attending: { name: '', team: '', region: '', html: '' },
      location: '',
      textMessageConfirmation: 'Yes',
      date: '2044-12-22T09:15:00.382936Z[Europe/London]',
      start: '2044-12-22T09:15:00.382936Z[Europe/London]',
      previousStart: '',
      end: '2044-12-22T09:15:00.382936Z[Europe/London]',
      previousEnd: '',
      notes: null,
      sensitivity: null,
      outcomeRecorded: null,
    })
    expect(getOverviewSpy).toHaveBeenCalledWith(crn)
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should set the meta data correctly if visor in registrations', async () => {
    const overview: Overview = {
      ...mockOverview,
      registrations: ['visor'],
    }
    jest.spyOn(MasApiClient.prototype, 'getOverview').mockImplementation(() => Promise.resolve(overview))
    const req = httpMocks.createRequest({
      params: {
        crn: 'X000002',
        id: 100,
      },
      session: {
        data: {
          appointments: {
            X000001: {
              100: mockAppt,
            },
          },
        },
      },
    })
    const res = {
      locals: {
        user: {
          username: 'user-1',
        },
      },
      redirect: jest.fn().mockReturnThis(),
    } as unknown as AppResponse

    await getAppointment(hmppsAuthClient)(req, res, nextSpy)
    expect(res.locals.appointment).toStrictEqual({
      meta: {
        change: null,
        forename: 'Joe',
        isVisor: true,
        userIsAttending: null,
      },
    })
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should set the meta data correctly if change in query params', async () => {
    const overview: Overview = {
      ...mockOverview,
      registrations: ['visor'],
    }
    jest.spyOn(MasApiClient.prototype, 'getOverview').mockImplementation(() => Promise.resolve(overview))
    const req = httpMocks.createRequest({
      params: {
        crn: 'X000002',
        id: 100,
      },
      query: {
        change: '/change/url',
      },
      session: {
        data: {
          appointments: {
            X000001: {
              100: mockAppt,
            },
          },
        },
      },
    })
    const res = {
      locals: {
        user: {
          username: 'user-1',
        },
      },
      redirect: jest.fn().mockReturnThis(),
    } as unknown as AppResponse

    await getAppointment(hmppsAuthClient)(req, res, nextSpy)
    expect(res.locals.appointment).toStrictEqual({
      meta: {
        change: '/change/url',
        forename: 'Joe',
        isVisor: true,
        userIsAttending: null,
      },
    })
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should not set the locals var if appointment not found in session', async () => {
    jest.spyOn(MasApiClient.prototype, 'getOverview').mockImplementation(() => Promise.resolve(mockOverview))
    const req = httpMocks.createRequest({
      params: {
        crn: 'X000002',
        id: 100,
      },
      session: {
        data: {
          appointments: {
            X000001: {
              100: mockAppt,
            },
          },
        },
      },
    })
    const res = {
      locals: {
        user: {
          username: 'user-1',
        },
      },
      redirect: jest.fn().mockReturnThis(),
    } as unknown as AppResponse

    await getAppointment(hmppsAuthClient)(req, res, nextSpy)
    expect(res.locals.appointment).toStrictEqual({
      meta: {
        change: null,
        forename: 'Joe',
        isVisor: false,
        userIsAttending: null,
      },
    })
    expect(nextSpy).toHaveBeenCalled()
  })
})
