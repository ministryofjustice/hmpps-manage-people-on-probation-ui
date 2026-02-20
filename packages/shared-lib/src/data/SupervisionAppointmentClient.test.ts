/* eslint-disable import/first */

jest.mock('@ministryofjustice/manage-people-on-probation-shared-lib')

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    isValidPath: jest.fn(),
    isValidHost: jest.fn(),
  }
})

jest.mock('./tokenStore/redisTokenStore')

import nock from 'nock'
import { getConfig } from '../config'
import { isValidHost, isValidPath } from '../utils'
import SupervisionAppointmentClient from './SupervisionAppointmentClient'
import {
  OutlookEventRequestBody,
  OutlookEventResponse,
  RescheduleEventRequest,
  EventResponse,
} from './model/OutlookEvent'

// Type casts
const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
const mockedIsValidHost = isValidHost as jest.MockedFunction<typeof isValidHost>
const mockedIsValidPath = isValidPath as jest.MockedFunction<typeof isValidPath>

const token = { access_token: 'token-1', expires_in: 300 }

const mockConfig: any = {
  apis: {
    masAppointmentsApi: {
      url: 'http://test-api',
      timeout: {
        response: 10000,
        deadline: 10000,
      },
      agent: {},
    },
  },
}

describe('MasOutlookClient', () => {
  let fakeApi: nock.Scope
  let client: SupervisionAppointmentClient
  beforeEach(() => {
    // jest.clearAllMocks()
    mockGetConfig.mockReturnValue(mockConfig)
    mockedIsValidHost.mockReturnValue(true)
    mockedIsValidPath.mockReturnValue(true)
    fakeApi = nock(mockConfig.apis.masAppointmentsApi.url)
    client = new SupervisionAppointmentClient(token.access_token)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  it('should post calendar event and return response body', async () => {
    const requestBody: OutlookEventRequestBody = {
      subject: 'Test event',
      start: '2025-01-01T10:00:00Z',
      recipients: [{ emailAddress: 'recipient@example.com', name: 'Recipient Name' }],
      message: 'Test message',
      durationInMinutes: 60,
      supervisionAppointmentUrn: 'URN-123',
    }

    const jsonString = JSON.stringify(requestBody)

    const responseBody: OutlookEventResponse = {
      id: 'evt-1',
      subject: 'Test event',
      startDate: '2025-01-01T10:00:00Z',
      endDate: '2025-01-01T11:00:00Z',
      attendees: ['', ''],
    }

    fakeApi
      .post('/calendar/event', jsonString)
      .matchHeader('authorization', `Bearer ${token.access_token}`)
      .reply(201, responseBody)

    const result = await client.postOutlookCalendarEvent(requestBody)
    expect(result).toEqual(responseBody)
  })

  it('should handle 500 by returning an error response with message', async () => {
    const requestBody: OutlookEventRequestBody = {
      subject: 'Test event',
      start: '2025-01-01T10:00:00Z',
      recipients: [{ emailAddress: 'recipient@example.com', name: 'Recipient Name' }],
      message: 'Test message',
      durationInMinutes: 60,
      supervisionAppointmentUrn: 'URN-123',
    }
    const jsonString = JSON.stringify(requestBody)

    const errorMessage = 'Internal Server Error'

    fakeApi
      .post('/calendar/event', jsonString)
      .matchHeader('authorization', `Bearer ${token.access_token}`)
      .reply(500, errorMessage)

    const result: any = await client.postOutlookCalendarEvent(requestBody)
    expect(result.status).toBe(500)
    expect(result.errors?.[0]?.text).toBe('Calendar event creation not successful')
    expect(result.text).toContain('Internal Server Error')
  })

  it('should post reschedule appointment event and return response body', async () => {
    const requestBody: RescheduleEventRequest = {
      rescheduledEventRequest: {
        recipients: [
          {
            emailAddress: 'recipient@example.com',
            name: 'Recipient Name',
          },
        ],
        message: '',
        subject: '',
        start: '',
        durationInMinutes: 0,
        supervisionAppointmentUrn: '',
      },
      oldSupervisionAppointmentUrn: 'URN-OLD-123',
    }

    const jsonString = JSON.stringify(requestBody)

    const responseBody: EventResponse = {
      id: 'evt-2',
      subject: 'Rescheduled event',
      startDate: '2025-02-01T10:00:00Z',
      endDate: '2025-02-01T11:00:00Z',
    }

    fakeApi
      .post('/calendar/event/reschedule', jsonString)
      .matchHeader('authorization', `Bearer ${token.access_token}`)
      .reply(201, responseBody)

    const result = await client.postRescheduleAppointmentEvent(requestBody)
    expect(result).toEqual(responseBody)
  })

  it('should handle 500 for reschedule by returning an error response with message', async () => {
    const requestBody: RescheduleEventRequest = {
      rescheduledEventRequest: {
        recipients: [
          {
            emailAddress: 'recipient@example.com',
            name: 'Recipient Name',
          },
        ],
        message: 'Message',
        subject: 'Subject',
        start: '2025-01-01T10:00:00Z',
        durationInMinutes: 0,
        supervisionAppointmentUrn: 'URN-123',
      },
      oldSupervisionAppointmentUrn: 'URN-OLD-123',
    }

    const jsonString = JSON.stringify(requestBody)

    const errorMessage = 'Internal Server Error'

    fakeApi
      .post('/calendar/event/reschedule', jsonString)
      .matchHeader('authorization', `Bearer ${token.access_token}`)
      .reply(500, errorMessage)

    const result: any = await client.postRescheduleAppointmentEvent(requestBody)
    expect(result.status).toBe(500)
    expect(result.errors?.[0]?.text).toBe('Rescheduling appointment not successful')
    expect(result.text).toContain('Internal Server Error')
  })
})
