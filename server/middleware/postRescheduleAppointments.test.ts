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
import { PersonAppointment } from '../data/model/schedule'
import { EventResponse, RescheduleEventRequest } from '../data/model/OutlookEvent'

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

jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockImplementation(() => Promise.resolve(mockUserDetails))

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
  until: tomorrow.toFormat('yyyy-M-dd'),
  interval: 'DAY',
  numberOfAppointments: '1',
  eventId: '250113825',
  requirementId: '1',
  licenceConditionId: '2500686668',
  notes: 'Some notes',
  sensitivity: 'Yes',
  visorReport: 'No',
  rescheduleAppointment: {
    reason: 'Reschedule reason',
    whoNeedsToReschedule: 'SERVICE',
    sensitivity: 'No',
  },
}

const mockFlags = {
  enableOutlookEvent: true,
}

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

const buildRequest = (appointment?: Record<string, string>): [httpMocks.MockRequest<any>, AppointmentSession] => {
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
      },
    },
  }
  return [httpMocks.createRequest(req), req.session.data.appointments[crn][uuid]]
}

describe('middleware/postRescheduleAppointments', () => {
  const res = mockAppResponse({
    flags: mockFlags,
    case: {
      name: { forename: 'James', surname: 'Morrison' },
      mobileNumber: '07822567890',
    },
    personAppointment: {
      appointment: {
        externalReference,
      },
    },
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('reschedule an appointment in the future', () => {
    const [req, mockAppointmentSession] = buildRequest()
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
  describe('reschedule an appointment in the past', () => {
    const [req, mockAppointmentSession] = buildRequest({ date: '2025-03-10', until: '2025-03-10' })
    const {
      date,
      start: startTime,
      end: endTime,
      user: { staffCode, teamCode, locationCode },
      notes,
      rescheduleAppointment: { whoNeedsToReschedule: requestedBy },
    } = mockAppointmentSession
    let returnedResponse: PersonAppointment
    beforeEach(async () => {
      returnedResponse = (await postRescheduleAppointments(hmppsAuthClient)(req, res)) as PersonAppointment
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
        outcomeRecorded: false,
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
    it('should create the outlook event if user email is defined', async () => {
      const [req] = buildRequest()
      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      const expectedBody: RescheduleEventRequest = {
        rescheduledEventRequest: {
          recipients: [
            {
              emailAddress: mockUserDetails.email,
              name: `${mockUserDetails.firstName} ${mockUserDetails.surname}`,
            },
          ],
          durationInMinutes: 30,
          message: `<a href=http://localhost:3000/case/X000001/appointments/appointment/12345/manage?back=/case/X000001/appointments target='_blank' rel="external noopener noreferrer"> View the appointment on Manage people on probation (opens in new tab).</a>`,
          start: null,
          subject: 'Planned Office Visit (NS) with ',
          supervisionAppointmentUrn: 'ABCDE',
        },
        oldSupervisionAppointmentUrn: externalReference,
      }
      expect(postRescheduleAppointmentEventSpy).toHaveBeenCalledWith(expectedBody)
    })
    it('should not create outlook event if rescheduled appointment is in the past', async () => {
      const [req] = buildRequest({ date: yesterday.toFormat('yyyy-M-dd'), until: yesterday.toFormat('yyyy-M-dd') })
      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      expect(postRescheduleAppointmentEventSpy).not.toHaveBeenCalled()
    })
    it('should not create outlook event if user has no email address defined', async () => {
      const [req] = buildRequest()
      jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockImplementationOnce(() =>
        Promise.resolve({
          ...mockUserDetails,
          email: '',
        }),
      )
      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      expect(postRescheduleAppointmentEventSpy).not.toHaveBeenCalled()
      expect(req.session.data.isOutLookEventFailed).toEqual(true)
    })
    it('should set failed outlook response', async () => {
      const [req] = buildRequest()
      jest
        .spyOn(SupervisionAppointmentClient.prototype, 'postRescheduleAppointmentEvent')
        .mockImplementation(() => Promise.resolve({ ...mockEventResponse, id: undefined }))
      await postRescheduleAppointments(hmppsAuthClient)(req, res)
      expect(req.session.data.isOutLookEventFailed).toEqual(true)
    })
  })
})
