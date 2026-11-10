import httpMocks from 'node-mocks-http'
import { getAppointment } from './getAppointment'
import { AppResponse } from '../models/Locals'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { AppointmentSession, AppointmentType } from '../models/Appointments'
import { Sentence } from '../data/model/sentenceDetails'
import { mockAppResponse } from '../controllers/mocks'

const crn = 'X000001'

const mockAppt: AppointmentSession = {
  type: 'COAP',
  eventId: '12345',
  user: {
    locationCode: 'NE5',
    teamCode: 'NE5TTT',
    username: 'user-1',
  },
  date: '2044-12-22T09:15:00.382936Z',
  start: '2044-12-22T09:15:00.382936Z',
  end: '2044-12-22T09:15:00.382936Z',
  smsOptIn: 'YES',
  rescheduleAppointment: {
    previousStart: '',
    previousEnd: '',
  },
}

const username = 'user-1'

jest.mock('../data/hmppsAuthClient')

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
  }
})

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

const mockRiskFlags = [
  { description: 'Restraining Order' },
  { description: 'Domestic Abuse Perpetrator' },
  { description: 'Risk to Known Adult' },
]

const mockResponse = (
  options: { allowSms?: boolean; mobileNumber?: string; personRisks?: unknown } = {},
): AppResponse => {
  const { allowSms = true, mobileNumber } = options
  const personRisks = 'personRisks' in options ? options.personRisks : { riskFlags: mockRiskFlags }
  const locals = {
    user: {
      username,
    },
    attendingUser: {
      staffCode: '',
      homeArea: '',
      team: '',
      username: '',
    },
    flags: {
      enableAllowSms: true,
    },
    case: {
      name: { forename: 'Joe', surname: 'Bloggs' },
      mobileNumber,
      allowSms,
    },
    personRisks,
  }
  return mockAppResponse(locals)
}

describe('/middleware/getAppointment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should assign appointment to locals var if found in session', async () => {
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
    const res = mockResponse()

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
      date: '2044-12-22T09:15:00.382936Z',
      start: '2044-12-22T09:15:00.382936Z',
      previousStart: '',
      end: '2044-12-22T09:15:00.382936Z',
      previousEnd: '',
      notes: null,
      sensitivity: null,
      outcomeRecorded: null,
      isReschedule: false,
      allowSms: true,
    })
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should assign appointment to locals var if reschedule appointment journey and allow sms is false', async () => {
    const res = mockResponse({ allowSms: false })
    const req = httpMocks.createRequest({
      params: {
        crn,
        id: '100',
      },
      session: {
        data: {
          appointments: {
            [crn]: {
              '100': { ...mockAppt, rescheduleAppointment: { ...mockAppt.rescheduleAppointment, contactId: '12345' } },
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
      textMessageConfirmation: null,
      date: '2044-12-22T09:15:00.382936Z',
      start: '2044-12-22T09:15:00.382936Z',
      previousStart: '',
      end: '2044-12-22T09:15:00.382936Z',
      previousEnd: '',
      notes: null,
      sensitivity: null,
      outcomeRecorded: null,
      isReschedule: true,
      allowSms: false,
    })
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should set the meta data correctly if visor in risk flags', async () => {
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
    const res = mockResponse({ personRisks: { riskFlags: [{ description: 'VISOR' }] } })

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

  it('should set isVisor to false if risk flags is an empty array', async () => {
    const req = httpMocks.createRequest({ params: { crn, id: '100' }, session: { data: {} } })
    const res = mockResponse({ personRisks: { riskFlags: [] } })

    await getAppointment(hmppsAuthClient)(req, res, nextSpy)
    expect(res.locals.appointment.meta.isVisor).toBe(false)
    expect(nextSpy).toHaveBeenCalled()
  })

  it.each([
    ['personRisks is undefined', undefined],
    ['riskFlags is undefined', {}],
    ['personRisks is an error response', { status: 500, message: 'Internal Server Error' }],
  ])('should throw and not call next if %s', async (_, personRisks) => {
    const req = httpMocks.createRequest({ params: { crn, id: '100' }, session: { data: {} } })
    const res = mockResponse({ personRisks })

    await expect(getAppointment(hmppsAuthClient)(req, res, nextSpy)).rejects.toThrow(
      `Unable to get risk flags for CRN ${crn}`,
    )
    expect(nextSpy).not.toHaveBeenCalled()
  })

  it('should set the meta data correctly if change in query params', async () => {
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

    const res = mockResponse({ personRisks: { riskFlags: [{ description: 'VISOR' }] } })
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
    const res = mockResponse()

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

  it('should populate appointment details using the selected sentence, requirement, licence condition and NSI', async () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id: '100',
      },
      session: {
        data: {
          appointments: {
            [crn]: {
              '100': {
                ...mockAppt,
                eventId: '12345',
                requirementId: '10',
                licenceConditionId: '20',
                nsiId: '30',
              },
            },
          },
          appointmentTypes: mockTypes,
          sentences: {
            [crn]: [
              {
                id: 12345,
                mainOffence: {
                  code: '18502',
                  description: 'Breach of Restraining Order (Protection from Harassment Act 1997) - 00831',
                },
                order: {
                  description: '12 month Community order',
                  startDate: '2023-12-01',
                  endDate: '2024-12-01',
                },
                requirements: [
                  {
                    id: 10,
                    description: 'Rehabilitation Activity Requirement',
                  },
                ],
                licenceConditions: [
                  {
                    id: 20,
                    mainDescription: 'Not to contact the victim directly or indirectly',
                  },
                ],
                nsis: [
                  {
                    id: 30,
                    description: 'Accommodation support',
                  },
                ],
              },
            ],
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

    const res = mockResponse({ mobileNumber: '07123456789' })

    await getAppointment(hmppsAuthClient)(req, res, nextSpy)

    expect(res.locals.appointment.appointmentFor).toStrictEqual({
      sentence: '12 month Community order',
      requirement: 'Rehabilitation Activity Requirement',
      licenceCondition: 'Not to contact the victim directly or indirectly',
      nsi: 'Accommodation support',
      forename: null,
      mobileNumber: '07123456789',
    })

    expect(nextSpy).toHaveBeenCalled()
  })
})
