import httpMocks from 'node-mocks-http'
import { DateTime } from 'luxon'
import MasApiClient from '../data/masApiClient'
import SupervisionAppointmentClient from '../data/SupervisionAppointmentClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { postRescheduleAppointments } from './postRescheduleAppointments'
import { mockAppResponse } from '../controllers/mocks'
import {
  AppointmentSession,
  AppointmentType,
  MasUserDetails,
  RescheduleAppointmentResponse,
} from '../models/Appointments'
import { PersonalDetails } from '../data/model/personalDetails'
import { EventResponse } from '../data/model/OutlookEvent'
import { AppResponse, LocalsUser } from '../models/Locals'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const hmppsAuthClient = new HmppsAuthClient(tokenStore)
const externalReference = 'urn:uk:gov:hmpps:manage-supervision-service:appointment:c8d13f72'

jest.mock('../data/masApiClient')
jest.mock('../data/SupervisionAppointmentClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const crn = 'X000001'
const uuid = '4715aa09-0f9d-4c18-948b-a42c45bc0974'
const contactId = '12345'
const username = 'user-1'
const now = DateTime.now()
const tomorrow = now.plus({ days: 1 })
const yesterday = now.minus({ days: 1 })
const mockRescheduleResponse: RescheduleAppointmentResponse = {
  id: 12345,
  externalReference: 'ABCDE',
}
const mockEventResponse: EventResponse = {
  id: '1234',
  subject: 'Mock subject',
  startDate: tomorrow.toISODate(),
  endDate: tomorrow.toISODate(),
  attendees: [],
  smsResponse: null,
}

const mockPersonalDetails: Partial<PersonalDetails> = {
  name: { forename: 'James', surname: 'Morrison' },
  mobileNumber: '07700900000',
}
const putRescheduleAppointmentSpy = jest
  .spyOn(MasApiClient.prototype, 'putRescheduleAppointment')
  .mockImplementation(() => Promise.resolve(mockRescheduleResponse))

const postRescheduleAppointmentEventSpy = jest
  .spyOn(SupervisionAppointmentClient.prototype, 'postRescheduleAppointmentEvent')
  .mockImplementation(() => Promise.resolve(mockEventResponse))

const mockUserDetails: MasUserDetails = {
  userId: 1234,
  username: 'test-user',
  firstName: 'Test',
  surname: 'User',
  email: 'test.user@justice.gov.uk',
  enabled: true,
  roles: [],
}

const mockUser: LocalsUser = {
  ...mockUserDetails,
  userId: mockUserDetails.userId.toString(),
  active: true,
  name: 'Mock User',
  authSource: 'delius',
  uuid: 'uuid-1',
  displayName: 'Mock User',
  token: '123ABC',
}

const mockAppointment: AppointmentSession = {
  user: {
    locationCode: 'HMP',
    teamCode: 'TEA',
    staffCode: 'TEA123',
    username,
  },
  type: 'COAP',
  date: tomorrow.toFormat('yyyy-M-dd'),
  start: '09:00',
  end: '09:30',
  eventId: '250113825',
  requirementId: '1',
  licenceConditionId: '2500686668',
  notes: 'Some notes',
  sensitivity: 'Yes',
  visorReport: 'No',
  outcomeRecorded: 'Yes',
  rescheduleAppointment: {
    contactId: '12345',
    reason: 'Reschedule reason',
    whoNeedsToReschedule: 'SERVICE',
    sensitivity: 'No',
  },
  smsPreview: {
    request: {
      firstName: 'James',
      includeWelshPreview: false,
      appointmentLocation: 'Mock Location',
      appointmentTypeCode: 'COAP',
      dateAndTimeOfAppointment: '2025-03-12T09:00:00.000Z',
    },
    preview: {
      englishSmsPreview: '',
      welshSmsPreview: '',
    },
  },
}

const mockFlags = (flags?: Record<string, boolean>) => ({
  enableSmsReminders: true,
  enableNonCompliance: false,
  ...(flags ?? {}),
})

const mockAppointmentTypes: AppointmentType[] = [
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
    code: 'COVC',
    description: 'Planned Video Contact (NS)',
    isPersonLevelContact: false,
    isLocationRequired: true,
  },
]

const buildRequest = (appointment?: Record<string, any>): [httpMocks.MockRequest<any>, AppointmentSession] => {
  const req = {
    params: {
      crn,
      id: uuid,
      contactId,
    },
    session: {
      data: {
        appointments: {
          [crn]: {
            [uuid]: { ...mockAppointment, ...(appointment || {}) },
          },
        },
        appointmentTypes: mockAppointmentTypes,
        personalDetails: {
          [crn]: {
            overview: mockPersonalDetails,
          },
        },
      },
    },
  }
  return [httpMocks.createRequest(req), req.session.data.appointments[crn][uuid]]
}

const mockLocals = ({
  flags = {},
  locals = {},
}: { flags?: Record<string, boolean>; locals?: Record<string, any> } = {}) => ({
  flags: mockFlags(flags),
  case: {
    name: { forename: 'James', surname: 'Morrison' },
    mobileNumber: '07822567890',
  },
  personAppointment: {
    appointment: {
      externalReference,
    },
  },
  user: mockUser,
  ...locals,
})

const buildResponse = ({
  flags = {},
  locals = {},
}: { flags?: Record<string, boolean>; locals?: Record<string, any> } = {}): AppResponse => {
  return mockAppResponse(mockLocals({ flags, locals }))
}

describe('middleware/postRescheduleAppointments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('reschedule an appointment in the future - Non compliance disabled', () => {
    const [req, mockAppointmentSession] = buildRequest({ outcomeRecorded: 'No' })
    const {
      date,
      start: startTime,
      end: endTime,
      user: { staffCode, teamCode, locationCode },
      notes,
      rescheduleAppointment: { whoNeedsToReschedule: requestedBy },
    } = mockAppointmentSession
    const expectedBody = {
      date,
      startTime,
      endTime,
      uuid,
      staffCode,
      teamCode,
      locationCode,
      requestedBy,
      notes,
      sensitive: true,
      isInFuture: true,
      sendToVisor: false,
      outcomeRecorded: false,
      reasonForRecreate: 'Reschedule reason',
      reasonIsSensitive: false,
    }
    let returnedResponse: RescheduleAppointmentResponse
    const res = buildResponse()
    beforeEach(async () => {
      returnedResponse = (await postRescheduleAppointments(hmppsAuthClient)(req, res)) as RescheduleAppointmentResponse
    })
    it('should send a reschedule appointment request to the api', () => {
      expect(putRescheduleAppointmentSpy).toHaveBeenCalledWith(contactId, expectedBody)
    })
    it('should return the response', () => {
      expect(returnedResponse).toEqual(mockRescheduleResponse)
    })
  })

  describe('reschedule an appointment in the future - Non compliance enabled', () => {
    const [req, mockAppointmentSession] = buildRequest({ outcomeRecorded: undefined })
    const {
      date,
      start: startTime,
      end: endTime,
      user: { staffCode, teamCode, locationCode },
      notes,
      rescheduleAppointment: { whoNeedsToReschedule: requestedBy },
    } = mockAppointmentSession
    const expectedBody = {
      date,
      startTime,
      endTime,
      uuid,
      staffCode,
      teamCode,
      locationCode,
      requestedBy,
      notes,
      sensitive: true,
      isInFuture: true,
      sendToVisor: false,
      outcomeRecorded: false,
      reasonForRecreate: 'Reschedule reason',
      reasonIsSensitive: false,
    }
    let returnedResponse: RescheduleAppointmentResponse
    const flags = { enableNonCompliance: true }
    const res = buildResponse({ flags })
    beforeEach(async () => {
      returnedResponse = (await postRescheduleAppointments(hmppsAuthClient)(req, res)) as RescheduleAppointmentResponse
    })
    it('should send a reschedule appointment request to the api', () => {
      expect(putRescheduleAppointmentSpy).toHaveBeenCalledWith(contactId, expectedBody)
    })
    it('should return the response', () => {
      expect(returnedResponse).toEqual(mockRescheduleResponse)
    })
  })

  describe('reschedule an appointment in the past - Non compliance disabled', () => {
    const [req, mockAppointmentSession] = buildRequest({ date: '2025-03-10' })
    const {
      date,
      start: startTime,
      end: endTime,
      user: { staffCode, teamCode, locationCode },
      notes,
      rescheduleAppointment: { whoNeedsToReschedule: requestedBy },
    } = mockAppointmentSession
    let returnedResponse: RescheduleAppointmentResponse
    const res = buildResponse()
    beforeEach(async () => {
      returnedResponse = (await postRescheduleAppointments(hmppsAuthClient)(req, res)) as RescheduleAppointmentResponse
    })
    it('should send a reschedule appointment request to the api', () => {
      const expectedBody = {
        date,
        startTime,
        endTime,
        uuid,
        staffCode,
        teamCode,
        locationCode,
        requestedBy,
        notes,
        sensitive: true,
        isInFuture: false,
        sendToVisor: false,
        outcomeRecorded: true,
        reasonForRecreate: 'Reschedule reason',
        reasonIsSensitive: false,
      }
      expect(putRescheduleAppointmentSpy).toHaveBeenCalledWith(contactId, expectedBody)
    })
    it('should return the response', () => {
      expect(returnedResponse).toEqual(mockRescheduleResponse)
    })
  })

  describe('reschedule an appointment in the past - Non compliance enabled', () => {
    const [req, mockAppointmentSession] = buildRequest({ date: '2025-03-10', outcome: { outcomeCode: 'ATTC' } })
    const {
      date,
      start: startTime,
      end: endTime,
      user: { staffCode, teamCode, locationCode },
      notes,
      rescheduleAppointment: { whoNeedsToReschedule: requestedBy },
    } = mockAppointmentSession
    let returnedResponse: RescheduleAppointmentResponse
    const flags = { enableNonCompliance: true }
    const res = buildResponse({ flags })
    beforeEach(async () => {
      returnedResponse = (await postRescheduleAppointments(hmppsAuthClient)(req, res)) as RescheduleAppointmentResponse
    })
    it('should send a reschedule appointment request to the api', () => {
      const expectedBody = {
        date,
        startTime,
        endTime,
        uuid,
        staffCode,
        teamCode,
        locationCode,
        requestedBy,
        notes,
        sensitive: true,
        isInFuture: false,
        sendToVisor: false,
        outcomeRecorded: true,
        reasonForRecreate: 'Reschedule reason',
        reasonIsSensitive: false,
      }
      expect(putRescheduleAppointmentSpy).toHaveBeenCalledWith(contactId, expectedBody)
    })
    it('should return the response', () => {
      expect(returnedResponse).toEqual(mockRescheduleResponse)
    })
  })

  describe('Send outlook invite', () => {
    it('should create the outlook event if user email is defined and calendar events feature flag is enabled', async () => {
      const [req] = buildRequest()
      const res = buildResponse()
      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      expect(postRescheduleAppointmentEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          rescheduledEventRequest: {
            recipients: [
              {
                emailAddress: mockUserDetails.email,
                name: `${mockUserDetails.firstName} ${mockUserDetails.surname}`,
              },
            ],
            durationInMinutes: 30,
            message: expect.stringContaining('View the appointment on Manage people on probation (opens in new tab).'),
            start: null,
            subject: 'J. Morrison: planned office visit (NS)',
            supervisionAppointmentUrn: 'ABCDE',
          },
          oldSupervisionAppointmentUrn: externalReference,
        }),
      )
    })
    it('should delete future outlook event if rescheduled appointment is in the past', async () => {
      const [req] = buildRequest({ date: yesterday.toFormat('yyyy-M-dd'), until: yesterday.toFormat('yyyy-M-dd') })
      const res = buildResponse()
      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      expect(postRescheduleAppointmentEventSpy).toHaveBeenCalled()
    })
    it('should not create outlook event if user has no email address defined', async () => {
      const [req] = buildRequest()
      const locals = { user: { ...mockUser, email: null as string } }
      const res = buildResponse({ locals })

      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      expect(postRescheduleAppointmentEventSpy).not.toHaveBeenCalled()
      expect(req.session.data.isOutLookEventFailed).toEqual(true)
    })
    it('should set failed outlook response', async () => {
      const [req] = buildRequest()
      const locals = { user: { ...mockUser, email: null as string } }
      const res = buildResponse({ locals })
      jest
        .spyOn(SupervisionAppointmentClient.prototype, 'postRescheduleAppointmentEvent')
        .mockImplementation(() => Promise.resolve({ ...mockEventResponse, id: undefined }))
      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      expect(req.session.data.isOutLookEventFailed).toEqual(true)
    })
  })

  describe('SMS reminders', () => {
    const baseFlags = {
      ...mockFlags,
      enableSmsReminders: true,
    }

    it('should include smsEventRequest when smsOptIn is YES', async () => {
      const [req] = buildRequest({ smsOptIn: 'YES' })
      const res = buildResponse({ flags: baseFlags })
      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      expect(postRescheduleAppointmentEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          rescheduledEventRequest: expect.objectContaining({
            smsEventRequest: expect.objectContaining({
              firstName: mockAppointment.smsPreview.request.firstName,
              mobileNumber: mockLocals().case.mobileNumber,
              crn,
              smsOptIn: true,
              appointmentLocation: mockAppointment.smsPreview.request.appointmentLocation,
              appointmentTypeCode: mockAppointment.smsPreview.request.appointmentTypeCode,
            }),
          }),
        }),
      )
    })

    it('should set isEnglishNotificationFailed when englishNotificationId is missing', async () => {
      const [req] = buildRequest({ smsOptIn: 'YES' })
      const res = buildResponse({ flags: baseFlags })
      jest.spyOn(SupervisionAppointmentClient.prototype, 'postRescheduleAppointmentEvent').mockResolvedValue({
        ...mockEventResponse,
        smsResponse: null,
      })
      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      expect(req.session.data.isEnglishNotificationFailed).toEqual(true)
    })

    it('should not set failure flags when SMS succeeds', async () => {
      const [req] = buildRequest({ smsOptIn: 'YES' })
      jest.spyOn(SupervisionAppointmentClient.prototype, 'postRescheduleAppointmentEvent').mockResolvedValue({
        ...mockEventResponse,
        smsResponse: {
          englishNotificationId: '11111111-1111-1111-1111-111111111111',
          welshNotificationId: '22222222-2222-2222-2222-222222222222',
        },
      })
      const res = buildResponse({ flags: baseFlags })
      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      expect(req.session.data.isEnglishNotificationFailed).toBeUndefined()
      expect(req.session.data.isWelshNotificationFailed).toBeUndefined()
    })

    it('should not include smsEventRequest when smsOptIn is not YES', async () => {
      const [req] = buildRequest({ smsOptIn: 'NO' })
      const res = buildResponse({ flags: baseFlags })
      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      expect(postRescheduleAppointmentEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          rescheduledEventRequest: expect.not.objectContaining({
            smsEventRequest: expect.anything(),
          }),
        }),
      )
    })

    it('should not include smsEventRequest when smsOptIn is not YES', async () => {
      const [req] = buildRequest({ smsOptIn: undefined as any })
      const res = buildResponse()
      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      expect(postRescheduleAppointmentEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          rescheduledEventRequest: expect.not.objectContaining({
            smsEventRequest: expect.anything(),
          }),
        }),
      )
    })

    it('should set isEnglishNotificationFailed when sms response is missing', async () => {
      const [req] = buildRequest({
        smsOptIn: 'YES', // ✅ REQUIRED
      } as any)
      const res = buildResponse()
      jest.spyOn(SupervisionAppointmentClient.prototype, 'postRescheduleAppointmentEvent').mockResolvedValue({
        ...mockEventResponse,
        smsResponse: null,
      })
      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      expect(req.session.data.isEnglishNotificationFailed).toBe(true)
    })

    it('should include smsEventRequest when smsOptIn is YES and mobile number exists', async () => {
      const [req] = buildRequest({
        smsOptIn: 'YES', // ✅ REQUIRED
      } as any)
      const res = buildResponse({ flags: { enableSmsReminders: true } })
      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      expect(postRescheduleAppointmentEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          rescheduledEventRequest: expect.objectContaining({
            smsEventRequest: expect.objectContaining({
              firstName: 'James',
              mobileNumber: '07822567890',
              crn,
              smsOptIn: true,
              includeWelshTranslation: false,
              appointmentLocation: 'Mock Location',
              appointmentTypeCode: 'COAP',
            }),
          }),
        }),
      )
    })

    it('should set isWelshNotificationFailed when welsh sms is missing', async () => {
      const [req] = buildRequest({
        smsOptIn: 'YES', // ✅ REQUIRED
        smsPreview: {
          request: {
            includeWelshPreview: true,
            appointmentLocation: 'Mock Location',
            appointmentTypeCode: 'COAP',
          },
        },
      } as any)
      const res = buildResponse()
      jest.spyOn(SupervisionAppointmentClient.prototype, 'postRescheduleAppointmentEvent').mockResolvedValue({
        ...mockEventResponse,
        smsResponse: {
          englishNotificationId: 'id-1',
          welshNotificationId: null,
        },
      })
      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      expect(req.session.data.isWelshNotificationFailed).toBe(true)
    })
  })
})
