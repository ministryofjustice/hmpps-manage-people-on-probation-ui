import httpMocks from 'node-mocks-http'
import { getAppointmentTypes } from './getAppointmentTypes'
import { HmppsAuthClient } from '../data'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { AppResponse } from '../models/Locals'
import ESupervisionClient from '../data/eSupervisionClient'
import { ESupervisionCheckInResponse } from '../data/model/esupervision'
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
  checkin: {
    uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    status: 'REVIEWED',
    dueDate: '2025-11-27',
    offender: {
      uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      firstName: 'Bob',
      lastName: 'Smith',
      status: 'INITIAL',
      practitioner: 'string',
      createdAt: '2025-11-27T15:40:42.399Z',
      photoUrl: 'string',
      checkinInterval: 'WEEKLY',
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
} as unknown as ESupervisionCheckInResponse

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
      expect(res.locals.checkIn).toEqual(checkInResponseMock.checkin)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })
})
