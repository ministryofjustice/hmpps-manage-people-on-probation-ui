import nock from 'nock'

import config from '../config'
import { isValidHost, isValidPath } from '../utils'
import ESupervisionClient from './ESupervisionClient'

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
        firstName: 'John',
        lastName: 'Doe',
        crn: 'X000001',
        dateOfBirth: '1990-01-01',
        email: 'test@test.com',
        phoneNumber: '07123456789',
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
        .post('/offender_setup', body)
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
        url: 'http://localhost:9091/esupervision/fake-s3-upload',
        contentType,
        duration: 'PT5M',
      }

      fakeESupervisionApi
        .post(`/offender_setup/${offenderSetup.uuid}/upload_location`)
        .query({ 'content-type': contentType })
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .matchHeader('content-type', 'application/json')
        .reply(200, response)

      const output = await client.getProfilePhotoUploadLocation(offenderSetup as any, contentType)
      expect(output).toEqual(response)
    })
  })
})
