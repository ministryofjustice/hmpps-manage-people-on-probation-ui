// File: `server/data/masOutlookClient.test.ts`
import nock from 'nock'

import config from '../config'
import { isValidHost, isValidPath } from '../utils'
import SupervisionAppointmentClient from './SupervisionAppointmentClient'
import { OutlookEventRequestBody, OutlookEventResponse } from './model/OutlookEvent'

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    isValidPath: jest.fn(),
    isValidHost: jest.fn(),
  }
})
const mockedIsValidHost = isValidHost as jest.MockedFunction<typeof isValidHost>
const mockedIsValidPath = isValidPath as jest.MockedFunction<typeof isValidPath>

jest.mock('./tokenStore/redisTokenStore')

const token = { access_token: 'token-1', expires_in: 300 }

describe('MasOutlookClient', () => {
  let fakeApi: nock.Scope
  let client: SupervisionAppointmentClient

  beforeEach(() => {
    jest.clearAllMocks()
    mockedIsValidHost.mockReturnValue(true)
    mockedIsValidPath.mockReturnValue(true)
    fakeApi = nock(config.apis.masAppointmentsApi.url)
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
})
