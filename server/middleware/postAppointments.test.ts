import httpMocks from 'node-mocks-http'
import * as Sentry from '@sentry/node'
import { postAppointments, buildCaseLink } from './postAppointments'
import { dateTime, isoFromDateTime } from '../utils'
import MasApiClient from '../data/masApiClient'
import SupervisionAppointmentClient from '../data/SupervisionAppointmentClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import logger from '../../logger'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { Sentence } from '../data/model/sentenceDetails'
import { UserLocation } from '../data/model/caseload'
import {
  AppointmentRequestBody,
  AppointmentSession,
  AppointmentsPostResponse,
  AppointmentType,
} from '../models/Appointments'
import { PersonalDetails } from '../data/model/personalDetails'
import { OutlookEventRequestBody, OutlookEventResponse, SmsEventRequest } from '../data/model/OutlookEvent'
import { mockAppResponse } from '../controllers/mocks'
import { AppResponse, LocalsUser } from '../models/Locals'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>

const crn = 'X000001'
const id = '4715aa09-0f9d-4c18-948b-a42c45bc0974'
const username = 'user-1'

jest.mock('../data/masApiClient')
jest.mock('../data/SupervisionAppointmentClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')
jest.mock('../services/flagService')
jest.mock('@sentry/node')
jest.mock('../../logger')

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
    licenceConditions: [{ id: 12345, mainDescription: '12 month Community order', code: 'R' }],
    requirements: [{ id: 12345, description: '12 month Community order', code: 'R' }],
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
    name: { forename: 'Mock', surname: 'User' },
    email: 'mock.user@email.com',
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
    user: { locationCode, username: _username, teamCode, name, email },
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

const mockOutlookEventResponse: OutlookEventResponse = {
  id: 'id',
  subject: 'sub',
  startDate: 'date',
  endDate: 'date',
  attendees: ['attendee1', 'attendee2'],
  smsResponse: {
    englishNotificationId: 'english-sms-id',
    welshNotificationId: 'welsh-sms-id',
  },
}

const mockAppointmentsPostResponse: AppointmentsPostResponse = {
  appointments: [{ id: 12345, externalReference: '1234' }],
}

const checkOutlookEventRequest = (smsRequest = false, firstName = mockUser.firstName) => {
  const { date, start } = mockAppointment
  const res = buildResponse()
  const smsEventRequest: SmsEventRequest = {
    firstName,
    mobileNumber: res.locals.case.mobileNumber,
    crn,
    smsOptIn: true,
    includeWelshTranslation: false,
    appointmentLocation: 'Mock Location',
    appointmentTypeCode: 'COAP',
  }
  const outlookEventRequestBody: OutlookEventRequestBody = {
    recipients: [
      {
        emailAddress: mockUser.email,
        name: `${mockUser.firstName} ${mockUser.surname}`,
      },
    ],
    durationInMinutes: 750,
    message: expect.stringContaining(
      `<a href="http://localhost:3000/case/${crn}/appointments/appointment/${mockAppointmentsPostResponse.appointments[0].id}/manage?back=/case/${crn}/appointments" target="_blank" rel="external noopener noreferrer">View the appointment on Manage people on probation (opens in new tab).</a>`,
    ),
    subject: `J. Morrison: planned office visit (NS)`,
    start: isoFromDateTime(date, start),
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

const mockUser: LocalsUser = {
  userId: '123',
  username: 'user-1',
  firstName: 'Mock',
  surname: 'User',
  email: 'mock.user@email.com',
  enabled: true,
  roles: [],
  active: true,
  name: 'Mock User',
  authSource: 'delius',
  uuid: 'uuid-1',
  displayName: 'Mock User',
  token: '123ABC',
}

const mockCase: Partial<PersonalDetails> = {
  name: { forename: 'James', surname: 'Morrison' },
  mobileNumber: '07700900000',
}

const buildResponse = ({
  locals = {},
  flags = {},
}: { locals?: Record<string, any>; flags?: Record<string, boolean> } = {}): AppResponse => {
  const localsRes = {
    case: mockCase,
    user: mockUser,
    flags: { enableMAN2344: true, enableSmsReminders: true, enableNonCompliance: false, ...flags },
    ...locals,
  }
  return mockAppResponse(localsRes)
}
const postAppointmentsSpy = jest
  .spyOn(MasApiClient.prototype, 'postAppointments')
  .mockResolvedValue(mockAppointmentsPostResponse)

let postOutlookCalendarEventSpy: jest.SpyInstance

describe('/middleware/postAppointments', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('It should post the correct request body', () => {
    beforeEach(() => {
      postOutlookCalendarEventSpy = jest
        .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
        .mockResolvedValue(mockOutlookEventResponse)
    })
    it('should add eventId to the request body if value in appointment session is not PERSON_LEVEL_CONTACT', async () => {
      const mockReq = createMockReq(mockAppointment)
      const res = buildResponse()
      const response = await postAppointments(hmppsAuthClient)(mockReq, res)
      const expectedRequestBody = getExpectedRequestBody()
      expect(postAppointmentsSpy).toHaveBeenCalledWith(crn, expectedRequestBody)
      expect(response).toEqual(mockAppointmentsPostResponse)
    })
    it('should not add the eventId to the request body if value in appointment session is PERSON_LEVEL_CONTACT', async () => {
      const appointment: AppointmentSession = {
        ...mockAppointment,
        eventId: 'PERSON_LEVEL_CONTACT',
      }
      const mockReq = createMockReq(appointment)
      const res = buildResponse()
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
      const res = buildResponse()
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
      const res = buildResponse()
      await postAppointments(hmppsAuthClient)(mockReq, res)
      const expectedRequestBody = getExpectedRequestBody({ licenceConditionId: undefined })
      expect(postAppointmentsSpy).toHaveBeenCalledWith(crn, expectedRequestBody)
    })

    it(`should add outcomeRecorded = true to the request body if outcome recorded - Non Compliance enabled`, async () => {
      const appointment: AppointmentSession = {
        ...mockAppointment,
        outcome: {
          outcomeCode: 'ATTC',
        },
      }
      const mockReq = createMockReq(appointment)
      const res = buildResponse({ flags: { enableNonCompliance: true } })
      await postAppointments(hmppsAuthClient)(mockReq, res)
      const expectedRequestBody = getExpectedRequestBody({ outcomeRecorded: true })
      expect(postAppointmentsSpy).toHaveBeenCalledWith(crn, expectedRequestBody)
    })

    it(`should add outcomeRecorded = false to the request body if future appointment and no outcome recorded - Non Compliance enabled`, async () => {
      const appointment: AppointmentSession = {
        ...mockAppointment,
        outcomeRecorded: undefined,
      }
      const mockReq = createMockReq(appointment)
      const res = buildResponse({ flags: { enableNonCompliance: true } })
      await postAppointments(hmppsAuthClient)(mockReq, res)
      const expectedRequestBody = getExpectedRequestBody({ outcomeRecorded: false })
      expect(postAppointmentsSpy).toHaveBeenCalledWith(crn, expectedRequestBody)
    })

    it('should not add nsiId to the request body if value is not in appointment session', async () => {
      const appointment: AppointmentSession = {
        ...mockAppointment,
        nsiId: undefined,
      }
      const mockReq = createMockReq(appointment)
      const res = buildResponse()
      await postAppointments(hmppsAuthClient)(mockReq, res)
      const expectedRequestBody = getExpectedRequestBody({ nsiId: undefined })
      expect(postAppointmentsSpy).toHaveBeenCalledWith(crn, expectedRequestBody)
    })
  })

  describe('Outlook calendar event request', () => {
    describe('User has email', () => {
      it(`should send the request with no sms event if appointment.smsOptIn value is 'NO'`, async () => {
        postOutlookCalendarEventSpy = jest
          .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
          .mockResolvedValueOnce(mockOutlookEventResponse)
        const mockReq = createMockReq(mockAppointment)
        const res = buildResponse()
        await postAppointments(hmppsAuthClient)(mockReq, res)
        checkOutlookEventRequest()
      })
      it(`should send the request with sms event if appointment.smsOptIn value is defined and not 'NO'`, async () => {
        postOutlookCalendarEventSpy = jest
          .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
          .mockResolvedValueOnce(mockOutlookEventResponse)
        const popFirstName = 'James'
        const mockReq = createMockReq({
          ...mockAppointment,
          smsOptIn: 'YES',
          smsPreview: {
            request: {
              firstName: popFirstName,
              dateAndTimeOfAppointment: '2025-03-12T09:00:00.000Z',
              includeWelshPreview: false,
              appointmentLocation: 'Mock Location',
              appointmentTypeCode: 'COAP',
            },
            preview: { englishSmsPreview: '', welshSmsPreview: '' },
          },
        })
        const res = buildResponse()
        await postAppointments(hmppsAuthClient)(mockReq, res)
        const smsRequest = true
        checkOutlookEventRequest(smsRequest, popFirstName)
      })
      it('should set req.session.data.isOutLookEventFailed to true if request does not have an id', async () => {
        postOutlookCalendarEventSpy = jest
          .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
          .mockResolvedValueOnce({ ...mockOutlookEventResponse, id: undefined })
        const mockReq = createMockReq({
          ...mockAppointment,
          smsOptIn: 'YES',
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
        })
        const res = buildResponse()
        await postAppointments(hmppsAuthClient)(mockReq, res)
        expect(mockReq.session.data.isOutLookEventFailed).toEqual(true)
      })
      it('should get email from user details if appointment session user email is blank', async () => {
        postOutlookCalendarEventSpy = jest
          .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
          .mockResolvedValueOnce(mockOutlookEventResponse)
        const getUserDetailsSpy = jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockResolvedValueOnce({
          userId: 123,
          username,
          firstName: 'Mock',
          surname: 'User',
          email: mockUser.email,
          enabled: true,
          roles: [],
        })
        const mockReq = createMockReq({
          ...mockAppointment,
          user: { ...mockAppointment.user, email: '' },
        })
        const res = buildResponse()

        await postAppointments(hmppsAuthClient)(mockReq, res)

        expect(getUserDetailsSpy).toHaveBeenCalledWith(username)
        checkOutlookEventRequest()
      })
      it('should capture exception and log error if postOutlookCalendarEvent returns 500 status', async () => {
        const errorMessage = 'Calendar event creation not successful.'
        postOutlookCalendarEventSpy = jest
          .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
          .mockResolvedValueOnce({
            status: 500,
            errors: [{ text: errorMessage }],
          } as any)

        const mockReq = createMockReq(mockAppointment)
        const res = buildResponse()

        await postAppointments(hmppsAuthClient)(mockReq, res)

        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            tags: expect.objectContaining({
              'http.status': '500',
              service: 'Probation Supervision Appointments Api',
              operation: 'postOutlookCalendarEvent',
            }),
          }),
        )
        expect(logger.warn).toHaveBeenCalledWith(
          expect.objectContaining({ apiErrors: [{ text: errorMessage }] }),
          'Failed to create calendar event',
        )
      })
    })
    describe('Attending user does not have email', () => {
      const mockReq = createMockReq({
        ...mockAppointment,
        user: { ...mockAppointment.user, email: null },
        smsOptIn: 'YES',
      })
      const locals = { user: { ...mockUser, email: null as string } }
      const res = buildResponse({ locals })

      beforeEach(async () => {
        await postAppointments(hmppsAuthClient)(mockReq, res)
      })
      it('should not send the request', () => {
        expect(postOutlookCalendarEventSpy).not.toHaveBeenCalled()
      })
      it('should set req.session.data.isOutLookEventFailed to true', () => {
        expect(mockReq.session.data.isOutLookEventFailed).toEqual(true)
      })
      it('should capture a Sentry exception when no email can be found for the attending user after the fallback lookup', () => {
        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            tags: expect.objectContaining({
              service: 'Probation Supervision Appointments Api',
              operation: 'postAppointments.getUserDetails',
            }),
          }),
        )
      })
    })

    describe('Attending user does not have email, and the fallback user details lookup also has no email', () => {
      // Reproduces a real scenario found in the dev environment: the fallback getUserDetails(username)
      // call succeeds (no error thrown) but the staff record itself has no email recorded at all
      // (e.g. a system/test account), so email remains blank even after the fallback lookup.
      it('should capture a Sentry exception without needing an error from the api call', async () => {
        jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockResolvedValueOnce({
          userId: 123,
          username,
          firstName: 'Mock',
          surname: 'User',
          email: undefined,
          enabled: true,
          roles: [],
        })
        const mockReq = createMockReq({
          ...mockAppointment,
          user: { ...mockAppointment.user, email: null },
          smsOptIn: 'YES',
        })
        const locals = { user: { ...mockUser, email: null as string } }
        const res = buildResponse({ locals })

        await postAppointments(hmppsAuthClient)(mockReq, res)

        expect(mockReq.session.data.isOutLookEventFailed).toEqual(true)
        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            tags: expect.objectContaining({
              service: 'Probation Supervision Appointments Api',
              operation: 'postAppointments.getUserDetails',
            }),
          }),
        )
      })
    })

    describe('Attending user name is missing from the appointment session (stale staff cache lookup)', () => {
      const buildMockReq = () =>
        createMockReq({
          ...mockAppointment,
          user: { ...mockAppointment.user, name: null },
        })

      it('should resolve and return the created appointment instead of throwing, when a fresh user lookup also has no name', async () => {
        const getUserDetailsSpy = jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockResolvedValueOnce(undefined)
        const mockReq = buildMockReq()
        const res = buildResponse()

        const response = await postAppointments(hmppsAuthClient)(mockReq, res)

        expect(getUserDetailsSpy).toHaveBeenCalledWith(username)
        expect(response).toEqual(mockAppointmentsPostResponse)
        expect(mockReq.session.data.isOutLookEventFailed).toEqual(true)
        expect(postOutlookCalendarEventSpy).not.toHaveBeenCalled()
      })
      it('should log userName as missing, when session-cache logging is enabled', async () => {
        jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockResolvedValueOnce(undefined)
        const mockReq = buildMockReq()
        const loggingRes = buildResponse({ flags: { enableSessionCacheLogging: true } })

        await postAppointments(hmppsAuthClient)(mockReq, loggingRes)

        expect(logger.info).toHaveBeenCalledWith(
          expect.objectContaining({
            event: 'sessionCachePresence',
            userPresent: true,
            userNamePresent: false,
            missing: expect.arrayContaining(['userName']),
          }),
          expect.stringContaining('missing=['),
        )
      })
      it('should attempt the fallback lookup and capture a Sentry exception when the original session name is an incomplete object (not null) and email is already present', async () => {
        const getUserDetailsSpy = jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockResolvedValueOnce(undefined)
        const mockReq = createMockReq({
          ...mockAppointment,
          user: { ...mockAppointment.user, name: { forename: '', surname: '' } },
        })
        const res = buildResponse()

        await postAppointments(hmppsAuthClient)(mockReq, res)

        expect(getUserDetailsSpy).toHaveBeenCalledWith(username)
        expect(Sentry.captureException).toHaveBeenCalledTimes(1)
        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            tags: expect.objectContaining({
              service: 'Probation Supervision Appointments Api',
              operation: 'postAppointments.getUserDetails',
              missingFields: 'name',
            }),
          }),
        )
        expect(mockReq.session.data.isOutLookEventFailed).toEqual(true)
        expect(postOutlookCalendarEventSpy).not.toHaveBeenCalled()
      })
      it('should capture a single combined Sentry exception when both name and email are still missing after fallback', async () => {
        jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockResolvedValueOnce(undefined)
        const mockReq = createMockReq({
          ...mockAppointment,
          user: { ...mockAppointment.user, name: null, email: null },
        })
        const res = buildResponse()

        await postAppointments(hmppsAuthClient)(mockReq, res)

        expect(Sentry.captureException).toHaveBeenCalledTimes(1)
        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            tags: expect.objectContaining({
              service: 'Probation Supervision Appointments Api',
              operation: 'postAppointments.getUserDetails',
              missingFields: 'name,email',
            }),
          }),
        )
        expect(mockReq.session.data.isOutLookEventFailed).toEqual(true)
        expect(postOutlookCalendarEventSpy).not.toHaveBeenCalled()
      })
      it('should treat a fallback lookup with a blank firstName/surname as still missing a name, and still capture a Sentry exception', async () => {
        const getUserDetailsSpy = jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockResolvedValueOnce({
          userId: 123,
          username,
          firstName: undefined,
          surname: undefined,
          email: mockUser.email,
          enabled: true,
          roles: [],
        })
        const mockReq = buildMockReq()
        const res = buildResponse()

        await postAppointments(hmppsAuthClient)(mockReq, res)

        expect(getUserDetailsSpy).toHaveBeenCalledWith(username)
        expect(Sentry.captureException).toHaveBeenCalledTimes(1)
        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            tags: expect.objectContaining({
              service: 'Probation Supervision Appointments Api',
              operation: 'postAppointments.getUserDetails',
              missingFields: 'name',
            }),
          }),
        )
        expect(mockReq.session.data.isOutLookEventFailed).toEqual(true)
        expect(postOutlookCalendarEventSpy).not.toHaveBeenCalled()
      })
      it('should recover the name from the fallback user details lookup and still send the calendar invite', async () => {
        postOutlookCalendarEventSpy = jest
          .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
          .mockResolvedValueOnce(mockOutlookEventResponse)
        const getUserDetailsSpy = jest.spyOn(MasApiClient.prototype, 'getUserDetails').mockResolvedValueOnce({
          userId: 123,
          username,
          firstName: 'Fallback',
          surname: 'Person',
          email: mockUser.email,
          enabled: true,
          roles: [],
        })
        const mockReq = buildMockReq()
        const res = buildResponse()

        await postAppointments(hmppsAuthClient)(mockReq, res)

        expect(getUserDetailsSpy).toHaveBeenCalledWith(username)
        expect(postOutlookCalendarEventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            recipients: [
              {
                emailAddress: mockUser.email,
                name: 'Fallback Person',
              },
            ],
          }),
        )
        expect(mockReq.session.data.isOutLookEventFailed).toBeFalsy()
        expect(Sentry.captureException).not.toHaveBeenCalled()
      })
    })

    describe('SMS', () => {
      beforeEach(() => {
        jest.clearAllMocks()
      })

      it('should set req.session.data.isEnglishNotificationFailed to true if request does not have a englishNotificationId ', async () => {
        postOutlookCalendarEventSpy = jest
          .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
          .mockResolvedValueOnce({
            ...mockOutlookEventResponse,
            id: 'id-1',
            smsResponse: {
              englishNotificationId: undefined,
            },
          })
        const mockReq = createMockReq({
          ...mockAppointment,
          smsOptIn: 'YES',
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
        })
        const res = buildResponse()
        await postAppointments(hmppsAuthClient)(mockReq, res)
        expect(mockReq.session.data.isEnglishNotificationFailed).toEqual(true)
      })

      it('should set req.session.data.isWelshNotificationFailed to true if request does not have a welshNotificationId ', async () => {
        postOutlookCalendarEventSpy = jest
          .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
          .mockResolvedValueOnce({
            ...mockOutlookEventResponse,
            id: 'id-1',
            smsResponse: {
              welshNotificationId: undefined,
            },
          })
        const mockReq = createMockReq({
          ...mockAppointment,
          smsOptIn: 'YES',
          smsPreview: {
            request: {
              firstName: 'James',
              includeWelshPreview: true,
              appointmentLocation: 'Mock Location',
              appointmentTypeCode: 'COAP',
              dateAndTimeOfAppointment: '2025-03-12T09:00:00.000Z',
            },
            preview: {
              englishSmsPreview: '',
              welshSmsPreview: '',
            },
          },
        })
        const res = buildResponse()
        await postAppointments(hmppsAuthClient)(mockReq, res)
        expect(mockReq.session.data.isWelshNotificationFailed).toEqual(true)
      })

      it('should set req.session.data.isEnglishNotificationFailed to undefined if request has a englishNotificationId ', async () => {
        postOutlookCalendarEventSpy = jest
          .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
          .mockResolvedValueOnce({
            ...mockOutlookEventResponse,
            id: 'id-1',
            smsResponse: {
              englishNotificationId: 'english-sms-id',
            },
          })
        const mockReq = createMockReq({
          ...mockAppointment,
          smsOptIn: 'YES',
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
        })
        const res = buildResponse()
        await postAppointments(hmppsAuthClient)(mockReq, res)
        expect(mockReq.session.data.isEnglishNotificationFailed).toEqual(undefined)
      })

      it('should set req.session.data.isEnglishNotificationFailed to undefined if request has a englishNotificationId ', async () => {
        postOutlookCalendarEventSpy = jest
          .spyOn(SupervisionAppointmentClient.prototype, 'postOutlookCalendarEvent')
          .mockResolvedValueOnce({
            ...mockOutlookEventResponse,
            id: 'id-1',
            smsResponse: {
              welshNotificationId: 'welsh-sms-id',
            },
          })
        const mockReq = createMockReq({
          ...mockAppointment,
          smsOptIn: 'YES',
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
        })
        const res = buildResponse()
        await postAppointments(hmppsAuthClient)(mockReq, res)
        expect(mockReq.session.data.isWelshNotificationFailed).toEqual(undefined)
      })
    })
  })
})
