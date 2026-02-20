import httpMocks from 'node-mocks-http'
import { postAppointments, buildCaseLink } from './postAppointments'
import { dateTime } from '../utils'
import MasApiClient from '../data/masApiClient'
import SupervisionAppointmentClient from '../data/SupervisionAppointmentClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { Sentence } from '../data/model/sentenceDetails'
import { UserLocation } from '../data/model/caseload'
import {
  AppointmentRequestBody,
  AppointmentSession,
  AppointmentsPostResponse,
  AppointmentType,
  MasUserDetails,
} from '../models/Appointments'
import { PersonalDetails } from '../data/model/personalDetails'
import { OutlookEventRequestBody, OutlookEventResponse, SmsEventRequest } from '../data/model/OutlookEvent'
import { mockAppResponse } from '../controllers/mocks'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>

const crn = 'X000001'
const id = '4715aa09-0f9d-4c18-948b-a42c45bc0974'
const username = 'user-1'

jest.mock('@ministryofjustice/manage-people-on-probation-shared-lib')

jest.mock('../data/masApiClient')
jest.mock('../data/SupervisionAppointmentClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')
jest.mock('../services/flagService')

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

const mockSentences: Sentence[] = [
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
      endDate: '2023-12-01',
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
]
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
  eventId: '250113825',
  requirementId: '1',
  licenceConditionId: '2500686668',
  nsiId: '2',
  notes: 'Some notes',
  sensitivity: 'Yes',
  smsOptIn: 'NO',
  outcomeRecorded: 'Yes',
}

const mockPersonalDetails: Partial<PersonalDetails> = {
  name: { forename: 'James', surname: 'Morrison' },
  mobileNumber: '07700900000',
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
        personalDetails: {
          [crn]: {
            overview: mockPersonalDetails,
          },
        },
      },
    },
  })
}

const getExpectedRequestBody = (request?: Partial<AppointmentRequestBody>): AppointmentRequestBody => {
  const {
    user: { locationCode, username: _username, teamCode },
    date,
    start,
    end,
    type,
    eventId,
    requirementId,
    licenceConditionId,
    nsiId,
    notes,
  } = mockAppointment
  return {
    user: {
      username: _username,
      locationCode,
      teamCode,
    },
    type,
    start: dateTime(date, start),
    end: dateTime(date, end),
    eventId: parseInt(eventId, 10),
    uuid: id,
    requirementId: parseInt(requirementId, 10),
    licenceConditionId: parseInt(licenceConditionId, 10),
    nsiId: parseInt(nsiId, 10),
    notes,
    sensitive: true,
    visorReport: false,
    outcomeRecorded: true,
    ...(request ?? {}),
  }
}

const mockUserDetailsResponse: MasUserDetails = {
  userId: 1,
  username,
  firstName: 'John',
  surname: 'Doe',
  email: 'jdoe@example.com',
  enabled: true,
  roles: ['role1', 'role2'],
}

const mockOutlookEventResponse: OutlookEventResponse = {
  id: 'id',
  subject: 'sub',
  startDate: 'date',
  endDate: 'date',
  attendees: ['attendee1', 'attendee2'],
}

const mockAppointmentsPostResponse: AppointmentsPostResponse = {
  appointments: [{ id: 12345, externalReference: '1234' }],
}

const checkOutlookEventRequest = (smsRequest = false) => {
  const { date, start } = mockAppointment
  const smsEventRequest: SmsEventRequest = {
    firstName: mockUserDetailsResponse.firstName,
    mobileNumber: mockPersonalDetails.mobileNumber,
    crn,
    smsOptIn: true,
  }
  const outlookEventRequestBody: OutlookEventRequestBody = {
    recipients: [
      {
        emailAddress: mockUserDetailsResponse.email,
        name: `${mockUserDetailsResponse.firstName} ${mockUserDetailsResponse.surname}`,
      },
    ],
    durationInMinutes: 750,
    message: expect.stringContaining(
      `<a href="http://localhost:3000/case/${crn}/appointments/appointment/${mockAppointmentsPostResponse.appointments[0].id}/manage?back=/case/${crn}/appointments" target="_blank" rel="external noopener noreferrer">View the appointment on Manage people on probation (opens in new tab).</a>`,
    ),
    subject: `Planned Office Visit (NS) with James Morrison`,
    start: dateTime(date, start).toISOString(),
    supervisionAppointmentUrn: mockAppointmentsPostResponse.appointments[0].externalReference,
  }
  expect(postOutlookCalendarEventSpy).toHaveBeenCalledWith(expect.objectContaining(outlookEventRequestBody))
  if (smsRequest) {
    expect(postOutlookCalendarEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ...outlookEventRequestBody,
        smsEventRequest,
      }),
    )
  }
}

const res = mockAppResponse()

const postAppointmentsSpy = jest
  .spyOn(MasApiClient.prototype, 'postAppointments')
  .mockResolvedValue(mockAppointmentsPostResponse)

let getUserDetailsSpy: jest.SpyInstance
let postOutlookCalendarEventSpy: jest.SpyInstance

describe('/middleware/postAppointments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  // afterEach(() => {
  //   jest.clearAllMocks()
  // })

  describe('It should post the correct request body', () => {
    beforeEach(() => {
      getUserDetailsSpy = jest
        .spyOn(MasApiClient.prototype, 'getUserDetails')
        .mockResolvedValue(mockUserDetailsResponse)
      postOutlookCalendarEventSpy = jest
        .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
        .mockResolvedValue(mockOutlookEventResponse)
    })
    it('should add eventId to the request body if value in appointment session is not PERSON_LEVEL_CONTACT', async () => {
      const mockReq = createMockReq(mockAppointment)
      const response = await postAppointments(hmppsAuthClient)(mockReq, res)
      const expectedRequestBody = getExpectedRequestBody()
      expect(postAppointmentsSpy).toHaveBeenCalledWith(crn, expectedRequestBody)
      expect(getUserDetailsSpy).toHaveBeenCalledWith(username)
      expect(response).toEqual(mockAppointmentsPostResponse)
    })
    it('should not add the eventId to the request body if value in appointment session is PERSON_LEVEL_CONTACT', async () => {
      const appointment: AppointmentSession = {
        ...mockAppointment,
        eventId: 'PERSON_LEVEL_CONTACT',
      }
      const mockReq = createMockReq(appointment)
      await postAppointments(hmppsAuthClient)(mockReq, res)
      const expectedRequestBody = getExpectedRequestBody({ eventId: undefined })
      expect(postAppointmentsSpy).toHaveBeenCalledWith(crn, expectedRequestBody)
    })
    it('should not add requirementId to the request body if value is not in appointment session', async () => {
      const appointment: AppointmentSession = {
        ...mockAppointment,
        requirementId: undefined,
      }
      const mockReq = createMockReq(appointment)
      await postAppointments(hmppsAuthClient)(mockReq, res)
      const expectedRequestBody = getExpectedRequestBody({ requirementId: undefined })
      expect(postAppointmentsSpy).toHaveBeenCalledWith(crn, expectedRequestBody)
    })

    it('should not add licenceConditionId to the request body if value is not in appointment session', async () => {
      const appointment: AppointmentSession = {
        ...mockAppointment,
        licenceConditionId: undefined,
      }
      const mockReq = createMockReq(appointment)
      await postAppointments(hmppsAuthClient)(mockReq, res)
      const expectedRequestBody = getExpectedRequestBody({ licenceConditionId: undefined })
      expect(postAppointmentsSpy).toHaveBeenCalledWith(crn, expectedRequestBody)
    })
    it(`should not add outcomeRecorded to the request body if appointment session value is not 'Yes'`, async () => {
      const appointment: AppointmentSession = {
        ...mockAppointment,
        outcomeRecorded: undefined,
      }
      const mockReq = createMockReq(appointment)
      await postAppointments(hmppsAuthClient)(mockReq, res)
      const expectedRequestBody = getExpectedRequestBody({ outcomeRecorded: undefined })
      expect(postAppointmentsSpy).toHaveBeenCalledWith(crn, expectedRequestBody)
    })
    it('should not add nsiId to the request body if value is not in appointment session', async () => {
      const appointment: AppointmentSession = {
        ...mockAppointment,
        nsiId: undefined,
      }
      const mockReq = createMockReq(appointment)
      await postAppointments(hmppsAuthClient)(mockReq, res)
      const expectedRequestBody = getExpectedRequestBody({ nsiId: undefined })
      expect(postAppointmentsSpy).toHaveBeenCalledWith(crn, expectedRequestBody)
    })
  })
  describe('Outlook calendar event request', () => {
    describe('User has email', () => {
      beforeEach(() => {
        getUserDetailsSpy = jest
          .spyOn(MasApiClient.prototype, 'getUserDetails')
          .mockResolvedValue(mockUserDetailsResponse)
      })
      it(`should send the request with no sms event if appointment.smsOptIn value is 'NO'`, async () => {
        postOutlookCalendarEventSpy = jest
          .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
          .mockResolvedValueOnce(mockOutlookEventResponse)
        const mockReq = createMockReq(mockAppointment)
        await postAppointments(hmppsAuthClient)(mockReq, res)
        checkOutlookEventRequest()
      })
      it(`should send the request with sms event if appointment.smsOptIn value is defined and not 'NO'`, async () => {
        postOutlookCalendarEventSpy = jest
          .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
          .mockResolvedValueOnce(mockOutlookEventResponse)
        const mockReq = createMockReq({ ...mockAppointment, smsOptIn: 'YES' })
        await postAppointments(hmppsAuthClient)(mockReq, res)
        const smsRequest = true
        checkOutlookEventRequest(smsRequest)
      })
      it('should set req.session.data.isOutLookEventFailed to true if request does not have an id', async () => {
        postOutlookCalendarEventSpy = jest
          .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
          .mockResolvedValueOnce({ ...mockOutlookEventResponse, id: undefined })
        const mockReq = createMockReq({ ...mockAppointment, smsOptIn: 'YES' })
        await postAppointments(hmppsAuthClient)(mockReq, res)
        expect(mockReq.session.data.isOutLookEventFailed).toEqual(true)
      })
    })
    describe('User does not have email', () => {
      const mockReq = createMockReq({ ...mockAppointment, smsOptIn: 'YES' })
      beforeEach(async () => {
        getUserDetailsSpy = jest
          .spyOn(MasApiClient.prototype, 'getUserDetails')
          .mockResolvedValue({ ...mockUserDetailsResponse, email: '' })
        await postAppointments(hmppsAuthClient)(mockReq, res)
      })
      it('should not send the request', () => {
        expect(postOutlookCalendarEventSpy).not.toHaveBeenCalled()
      })
      it('should set req.session.data.isOutLookEventFailed to true', () => {
        expect(mockReq.session.data.isOutLookEventFailed).toEqual(true)
      })
    })
  })
})
