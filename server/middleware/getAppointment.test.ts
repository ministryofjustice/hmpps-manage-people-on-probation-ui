import httpMocks from 'node-mocks-http'
import { getAppointment } from './getAppointment'
import { AppResponse } from '../models/Locals'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { getDataValue } from '../utils'
import MasApiClient from '../data/masApiClient'
import { Overview } from '../data/model/overview'
import { AppointmentType } from '../models/Appointments'

const crn = 'X000001'

const mockAppt = {
  type: 'Phone call',
  location: '',
  date: '2044-12-22T09:15:00.382936Z[Europe/London]',
  start: '2044-12-22T09:15:00.382936Z[Europe/London]',
  end: '2044-12-22T09:15:00.382936Z[Europe/London]',
  repeating: 'Yes',
  interval: '',
  numberOfAppointments: '',
  id: 1,
}

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/masApiClient')

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    getDataValue: jest.fn(),
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

const mockGetDataValue = getDataValue as jest.MockedFunction<typeof getDataValue>

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

describe('/middleware/getAppointment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  // it('should assign appointment to locals var if found in session', async () => {
  //   const getOverviewSpy = jest
  //     .spyOn(MasApiClient.prototype, 'getOverview')
  //     .mockImplementation(() => Promise.resolve(mockOverview))
  //   mockGetDataValue.mockReturnValue(mockAppt)

  //   const req = httpMocks.createRequest({
  //     params: {
  //       crn,
  //       id: '100',
  //     },
  //     session: {
  //       data: {
  //         appointments: {
  //           [crn]: {
  //             '100': mockAppt,
  //           },
  //         },
  //         appointmentTypes: mockTypes,
  //       },
  //     },
  //   })
  //   const res = {
  //     locals: {
  //       user: {
  //         username: 'user-1',
  //       },
  //     },
  //     redirect: jest.fn().mockReturnThis(),
  //   } as unknown as AppResponse
  //   await getAppointment(hmppsAuthClient)(req, res, nextSpy)
  //   expect(getOverviewSpy).toHaveBeenCalledWith(crn)
  //   expect(nextSpy).toHaveBeenCalled()
  // })

  it('should set the meta data correctly if visor in registrations', async () => {
    const overview: Overview = {
      ...mockOverview,
      registrations: ['visor'],
    }
    jest.spyOn(MasApiClient.prototype, 'getOverview').mockImplementation(() => Promise.resolve(overview))
    mockGetDataValue.mockReturnValue(null)
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
    mockGetDataValue.mockReturnValue(null)
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
    mockGetDataValue.mockReturnValue(null)
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
