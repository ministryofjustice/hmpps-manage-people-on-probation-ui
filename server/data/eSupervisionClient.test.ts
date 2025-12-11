import nock from 'nock'

import config from '../config'
import { isValidHost, isValidPath } from '../utils'
import ESupervisionClient from './eSupervisionClient'
import {
  ESupervisionCheckIn,
  ESupervisionCheckInResponse,
  ESupervisionNote,
  ESupervisionReview,
} from './model/esupervision'

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

describe('ESupervisionClient', () => {
  let fakeESupervisionApi: nock.Scope
  let client: ESupervisionClient

  beforeEach(() => {
    jest.clearAllMocks()
    mockedIsValidHost.mockReturnValue(true)
    mockedIsValidPath.mockReturnValue(true)
    fakeESupervisionApi = nock(config.apis.eSupervisionApi.url)
    client = new ESupervisionClient(token.access_token)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('postOffenderSetup', () => {
    it('should POST offender setup details and return response', async () => {
      const body = {
        setupUuid: 'setup-uuid-1',
        practitionerId: 'user-1',
        crn: 'X000001',
        firstCheckinDate: '2024-01-01',
        checkinInterval: 'WEEKLY',
        startedAt: '2024-01-01T10:00:00Z',
      }
      const response = {
        uuid: 'setup-uuid-1',
        practitioner: 'user-1',
        offender: 'X000001',
        createdAt: '2024-01-01T10:00:00Z',
      }

      fakeESupervisionApi
        .post('/v2/offender_setup', body)
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await client.postOffenderSetup(body as any)
      expect(output).toEqual(response)
    })
  })

  describe('getProfilePhotoUploadLocation', () => {
    it('should POST to upload_location with query content-type and return location info', async () => {
      const offenderSetup = {
        uuid: 'abc-123',
        practitioner: 'user1',
        offender: 'X000001',
        createdAt: '2024-01-02T11:00:00Z',
      }
      const contentType = 'image/jpeg'
      const response = {
        url: 'http://localhost:9091/esupervision/v2/fake-s3-upload',
        contentType,
        duration: 'PT5M',
      }

      fakeESupervisionApi
        .post(`/v2/offender_setup/${offenderSetup.uuid}/upload_location`)
        .query({ 'content-type': contentType })
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .matchHeader('content-type', 'application/json')
        .reply(200, response)

      const output = await client.getProfilePhotoUploadLocation(offenderSetup as any, contentType)
      expect(output).toEqual(response)
    })
  })

  describe('getOffenderCheckIn', () => {
    it('should GET checkin details from uuid', async () => {
      const checkInUuid = '3fa85f64-5717-4562-b3fc-2c963f66afa6'

      const response: ESupervisionCheckInResponse = {
        checkin: {
          uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          status: 'REVIEWED',
          dueDate: '2025-11-27',
          personalDetails: {
            crn: 'X123456',
            name: {
              forename: 'Bob',
              surname: 'Smith',
            },
            mobile: '07700900123',
            email: 'john.smith@example.com',
            practitioner: {
              name: {
                forename: 'John',
                surname: 'Smith',
              },
              email: 'practitioner@example.com',
              localAdminUnit: {
                code: 'N01ABC',
                description: 'London North LAU',
              },
              probationDeliveryUnit: {
                code: 'N01ABC',
                description: 'London North LAU',
              },
              provider: {
                code: 'N01ABC',
                description: 'London North LAU',
              },
            },
          },
          surveyResponse: {
            mentalHealth: 'well',
            assistance: ['thing1', 'thing2'],
            callback: 'no',
          },
          createdBy: 'string',
          createdAt: '2025-11-27T15:40:42.399Z',
          videoUrl: 'string',
          snapshotUrl: 'string',
          autoIdCheck: 'MATCH',
          manualIdCheck: 'MATCH',
          flaggedResponses: ['string'],
        },
        checkinLogs: {
          hint: 'ALL',
          logs: [
            {
              comment: 'string',
              offender: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
              createdAt: '2025-11-27T15:40:42.399Z',
              uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
              practitioner: 'string',
              logEntryType: 'OFFENDER_SETUP_COMPLETE',
              checkin: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
            },
          ],
        },
      }

      fakeESupervisionApi
        .get(`/v2/offender_checkins/${checkInUuid}`)
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await client.getOffenderCheckIn(checkInUuid)
      expect(output).toEqual(response)
    })
  })

  describe('postOffenderCheckInReview', () => {
    it('should POST review to uuid', async () => {
      const checkInUuid = '3fa85f64-5717-4562-b3fc-2c963f66afa6'

      const review: ESupervisionReview = {
        reviewedBy: 'id',
        manualIdCheck: 'NO_MATCH',
        missedCheckinComment: 'no reason',
      }

      const response: ESupervisionCheckIn = {
        uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        status: 'REVIEWED',
        dueDate: '2025-11-27',
        personalDetails: {
          crn: 'X123456',
          name: {
            forename: 'Bob',
            surname: 'Smith',
          },
          mobile: '07700900123',
          email: 'john.smith@example.com',
          practitioner: {
            name: {
              forename: 'John',
              surname: 'Smith',
            },
            email: 'practitioner@example.com',
            localAdminUnit: {
              code: 'N01ABC',
              description: 'London North LAU',
            },
            probationDeliveryUnit: {
              code: 'N01ABC',
              description: 'London North LAU',
            },
            provider: {
              code: 'N01ABC',
              description: 'London North LAU',
            },
          },
        },
        surveyResponse: {
          mentalHealth: 'well',
          assistance: ['thing1', 'thing2'],
          callback: 'no',
        },
        createdBy: 'string',
        createdAt: '2025-11-27T15:40:42.399Z',
        videoUrl: 'string',
        snapshotUrl: 'string',
        autoIdCheck: 'MATCH',
        manualIdCheck: 'MATCH',
        flaggedResponses: ['string'],
      }

      fakeESupervisionApi
        .post(`/v2/offender_checkins/${checkInUuid}/review`)
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await client.postOffenderCheckInReview(checkInUuid, review)
      expect(output).toEqual(response)
    })
  })

  describe('postOffenderCheckInNote', () => {
    it('should POST note to uuid', async () => {
      const checkInUuid = '3fa85f64-5717-4562-b3fc-2c963f66afa6'

      const notes: ESupervisionNote = {
        updatedBy: 'id',
        notes: 'note',
      }

      const response = {}

      fakeESupervisionApi
        .post(`/v2/offender_checkins/${checkInUuid}/annotate`)
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await client.postOffenderCheckInNote(checkInUuid, notes)
      expect(output).toEqual(response)
    })
  })
})
