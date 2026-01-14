import httpMocks from 'node-mocks-http'
import { getAppointmentTypes } from './getAppointmentTypes'
import { HmppsAuthClient } from '../data'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { AppResponse } from '../models/Locals'
import ESupervisionClient from '../data/eSupervisionClient'
import { ESupervisionCheckIn } from '../data/model/esupervision'
import { getCheckIn } from './getCheckIn'

const token = { access_token: 'token-1', expires_in: 300 }
const username = 'user-1'
jest.mock('../data/tokenStore/redisTokenStore')
const tokenSpy = jest
  .spyOn(HmppsAuthClient.prototype, 'getSystemClientToken')
  .mockImplementation(() => Promise.resolve(token.access_token))
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
tokenStore.getToken.mockResolvedValue(token.access_token)

const checkInResponseMock = {
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
  checkinLogs: {
    hint: '',
    logs: [
      {
        createdAt: '2026-01-07T12:06:44.154Z',
        uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        practitioner: 'string',
        logEntryType: 'OFFENDER_CHECKIN_REVIEW_SUBMITTED',
        notes: 'Further Action',
        checkin: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      },
      {
        createdAt: '2026-01-07T12:06:44.154Z',
        uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        practitioner: 'string',
        logEntryType: 'OFFENDER_CHECKIN_NOT_SUBMITTED',
        notes: 'Missed reason',
        checkin: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      },
      {
        createdAt: '2026-01-07T12:06:44.154Z',
        uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        practitioner: 'string',
        logEntryType: 'OFFENDER_CHECKIN_ANNOTATED',
        notes: 'Note 1',
        checkin: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      },
      {
        createdAt: '2026-01-07T12:06:44.154Z',
        uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        practitioner: 'string',
        logEntryType: 'OFFENDER_CHECKIN_ANNOTATED',
        notes: 'Note 2',
        checkin: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      },
    ],
  },
} as unknown as ESupervisionCheckIn

const hmppsAuthClient = new HmppsAuthClient(tokenStore)

const res = {
  locals: {
    user: {
      username,
    },
  },
  redirect: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const nextSpy = jest.fn()

const spy = jest
  .spyOn(ESupervisionClient.prototype, 'getOffenderCheckIn')
  .mockImplementation(() => Promise.resolve(checkInResponseMock))

describe('middleware/getCheckIn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('CheckIn works correctly', () => {
    const req = httpMocks.createRequest({})
    beforeEach(async () => {
      await getCheckIn(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should make an api request', () => {
      expect(spy).toHaveBeenCalled()
    })
    it('should add checkIn to res.locals', () => {
      expect(res.locals.checkIn).toEqual(checkInResponseMock)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })
})
