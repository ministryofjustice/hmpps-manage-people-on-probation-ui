import httpMocks from 'node-mocks-http'
import { postAppointments } from './postAppointments'
import { dateTime } from '../utils'
import MasApiClient from '../data/masApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { Sentence } from '../data/model/sentenceDetails'
import { UserLocation } from '../data/model/caseload'
import { AppResponse } from '../models/Locals'
import { AppointmentSession, AppointmentType, MasUserDetails } from '../models/Appointments'
import SupervisionAppointmentClient from '../data/SupervisionAppointmentClient'
import config from '../config'
import { getDurationInMinutes } from '../utils/getDurationInMinutes'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>

jest.mock('../data/masApiClient')
jest.mock('../data/SupervisionAppointmentClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const crn = 'X000001'
const id = '4715aa09-0f9d-4c18-948b-a42c45bc0974'
const username = 'user-1'
const res = {
  locals: {
    user: {
      username,
    },
  },
  redirect: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const hmppsAuthClient = new HmppsAuthClient(tokenStore)

const mockUserLocations = [
  {
    id: 1234,
    description: 'HMP Wakefield',
    address: {
      buildingNumber: '5',
      streetName: 'Love Lane',
      town: 'Wakefield',
      county: 'West Yorkshire',
      postcode: 'WF2 9AG',
    },
  },
] as UserLocation[]

const mockSentences = [
  {
    id: 12345,
    eventNumber: '16',
    mainOffence: {
      code: '18502',
      description: '12 month community order',
    },
    order: {
      description: '12 month Community order',
      startDate: '2023-12-01',
      length: '2',
    },
    licenceConditions: [{ id: 12345, mainDescription: '12 month Community order' }],
    requirements: [{ id: 12345, description: '12 month Community order' }],
    nsis: [],
    offenceDetails: {
      eventNumber: '1234',
      offence: null,
      dateOfOffence: '2024-12-01',
      notes: '',
      additionalOffences: [],
    },
    conviction: {
      sentencingCourt: '',
      responsibleCourt: '',
      convictionDate: '',
      additionalSentences: '',
    },
    courtDocuments: [],
    unpaidWorkProgress: '',
  },
] as Sentence[]

const mockAppointment: AppointmentSession = {
  user: {
    locationCode: 'HMP',
    teamCode: 'TEA',
    username,
  },
  type: 'COAP',
  date: '2025-03-12',
  start: '9:00am',
  end: '9:30pm',
  until: '2025-03-19',
  interval: 'WEEK',
  numberOfAppointments: '2',
  eventId: '250113825',
  requirementId: '1',
  licenceConditionId: '2500686668',
  notes: 'Some notes',
  sensitivity: 'Yes',
}

const appointmentTypes: AppointmentType[] = [
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
  {
    code: 'CODC',
    description: 'Planned Doorstep Contact (NS)',
    isPersonLevelContact: true,
    isLocationRequired: true,
  },
]
const createMockReq = (appointment: AppointmentSession) => {
  return httpMocks.createRequest({
    params: {
      crn,
      id,
    },
    session: {
      data: {
        locations: {
          [username]: mockUserLocations,
        },
        sentences: {
          [crn]: mockSentences,
        },
        appointments: {
          [crn]: {
            [id]: appointment,
          },
        },
        appointmentTypes,
      },
    },
  })
}

const req = createMockReq(mockAppointment)

const nextSpy = jest.fn()

describe('/middleware/postAppointments', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  const {
    user: { locationCode, teamCode },
    date,
    start: startTime,
    end: endTime,
    type,
    interval,
    eventId,
    numberOfAppointments: repeatCount,
    licenceConditionId,
  } = req.session.data.appointments[crn][id]

  const spy = jest
    .spyOn(MasApiClient.prototype, 'postAppointments')
    .mockImplementation(() => Promise.resolve({ appointments: [{ id: 0, externalReference: 'apt-ref-1' }] }))

  const spyUserEmail = jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockImplementation(() =>
    Promise.resolve({
      userId: 1,
      username: 'user.name',
      firstName: 'John',
      surname: 'Doe',
      email: 'jdoe@example.com',
      enabled: true,
      roles: ['role1', 'role2'],
    }),
  )

  const spymasOutlookEvent = jest
    .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
    .mockImplementation(() =>
      Promise.resolve({
        id: 'id',
        subject: 'sub',
        startDate: 'date',
        endDate: 'date',
        attendees: ['attendee1', 'attendee2'],
      }),
    )

  it('should post the correct request body', async () => {
    const expectedBody = {
      user: {
        username,
        locationCode,
        teamCode,
      },
      type,
      start: dateTime(date, startTime),
      end: dateTime(date, endTime),
      interval,
      numberOfAppointments: parseInt(repeatCount, 10),
      createOverlappingAppointment: true,
      requirementId: 1,
      licenceConditionId: parseInt(licenceConditionId, 10),
      eventId: parseInt(eventId, 10),
      uuid: id,
      until: dateTime('2025-03-19', endTime),
      notes: 'Some notes',
      sensitive: true,
      visorReport: false,
    }
    await postAppointments(hmppsAuthClient)(req, res, nextSpy)
    expect(spy).toHaveBeenCalledWith(crn, expectedBody)
    expect(nextSpy).not.toHaveBeenCalled()
  })

  it('should not include the eventId in the request if PERSON_LEVEL_CONTACT', async () => {
    const appointment = {
      ...mockAppointment,
      eventId: 'PERSON_LEVEL_CONTACT',
    }
    const mockReq = createMockReq(appointment)
    const expectedBody = {
      user: {
        username,
        locationCode,
        teamCode,
      },
      type,
      start: dateTime(date, startTime),
      end: dateTime(date, endTime),
      interval,
      numberOfAppointments: parseInt(repeatCount, 10),
      createOverlappingAppointment: true,
      requirementId: 1,
      licenceConditionId: parseInt(licenceConditionId, 10),
      uuid: id,
      until: dateTime('2025-03-19', endTime),
      notes: 'Some notes',
      sensitive: true,
      visorReport: false,
    }
    await postAppointments(hmppsAuthClient)(mockReq, res, nextSpy)
    expect(spy).toHaveBeenCalledWith(crn, expectedBody)
  })

  it('should create Outlook event when user has email and not set isOutLookEventFailed', async () => {
    const localReq = createMockReq(mockAppointment)

    // getUserDetails returns email (already mocked above)
    const postSpy = jest
      .spyOn(MasApiClient.prototype, 'postAppointments')
      .mockResolvedValue({ appointments: [{ id: 123, externalReference: 'urn-1' }] })

    const outlookSpy = jest
      .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
      .mockResolvedValue({ id: 'evt-1', subject: 's', startDate: 'd1', endDate: 'd2', attendees: [] })

    await postAppointments(hmppsAuthClient)(localReq, res, nextSpy)

    expect(postSpy).toHaveBeenCalled()
    expect(outlookSpy).toHaveBeenCalled()
    expect(localReq.session.data.isOutLookEventFailed).toBeUndefined()
  })

  it('should set isOutLookEventFailed when no user email', async () => {
    const localReq = createMockReq(mockAppointment)

    jest
      .spyOn(MasApiClient.prototype, 'postAppointments')
      .mockResolvedValue({ appointments: [{ id: 321, externalReference: 'urn-2' }] })
    jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockResolvedValue({
      userId: 1,
      username: 'user.name',
      firstName: 'John',
      surname: 'Platt',
      email: undefined,
      enabled: true,
      roles: [],
    } as MasUserDetails)

    await postAppointments(hmppsAuthClient)(localReq, res, nextSpy)

    expect(localReq.session.data.isOutLookEventFailed).toBe(true)
  })

  it('should set isOutLookEventFailed when Outlook response has no id', async () => {
    const localReq = createMockReq(mockAppointment)

    jest
      .spyOn(MasApiClient.prototype, 'postAppointments')
      .mockResolvedValue({ appointments: [{ id: 222, externalReference: 'urn-3' }] })
    jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockResolvedValue({
      userId: 1,
      username: 'user.name',
      firstName: 'John',
      surname: 'Platt',
      email: 'jplatt@example.com',
      enabled: true,
      roles: [],
    } as MasUserDetails)

    jest.spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent').mockResolvedValue({
      id: '',
      subject: 's',
      startDate: 'd1',
      endDate: 'd2',
      attendees: [],
    })

    await postAppointments(hmppsAuthClient)(localReq, res, nextSpy)

    expect(localReq.session.data.isOutLookEventFailed).toBe(true)
  })

  it('should build the correct Outlook event request body on success', async () => {
    const localReq = createMockReq(mockAppointment)
    // Provide name for subject building
    localReq.session.data.personalDetails = {
      [crn]: { name: { forename: 'John', middleName: '', surname: 'Doe' } },
    } as any

    const appointmentId = 555
    const externalReference = 'apt-ref-555'

    jest
      .spyOn(MasApiClient.prototype, 'postAppointments')
      .mockResolvedValue({ appointments: [{ id: appointmentId, externalReference }] })

    // Ensure outlook call succeeds
    const outlookSpy = jest
      .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
      .mockResolvedValue({ id: 'evt-555', subject: 's', startDate: 'd1', endDate: 'd2', attendees: [] })

    await postAppointments(hmppsAuthClient)(localReq, res, nextSpy)

    const arg = outlookSpy.mock.calls[0][0]

    const expectedMessage = `<a href=${config.domain}/case/${crn}/appointments/appointment/${appointmentId}/manage?back=/case/${crn}/appointments target='_blank' rel="external noopener noreferrer"> View the appointment on Manage people on probation (opens in new tab).</a>`
    const expectedSubject = 'Planned Office Visit (NS) with John Doe'
    const expectedStart = dateTime(mockAppointment.date, mockAppointment.start).toISOString()
    const expectedDuration = getDurationInMinutes(
      dateTime(mockAppointment.date, mockAppointment.start),
      dateTime(mockAppointment.date, mockAppointment.end),
    )

    expect(arg).toEqual({
      recipients: [
        {
          emailAddress: 'jplatt@example.com',
          name: 'John Platt',
        },
      ],
      message: expectedMessage,
      subject: expectedSubject,
      start: expectedStart,
      durationInMinutes: expectedDuration,
      supervisionAppointmentUrn: externalReference,
    })
  })
})
