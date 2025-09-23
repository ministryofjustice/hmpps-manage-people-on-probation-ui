import httpMocks from 'node-mocks-http'
import { getSentences } from './getSentences'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import { HmppsAuthClient } from '../data'
import { Sentences } from '../data/model/sentenceDetails'
import { AppResponse } from '../models/Locals'

const token = { access_token: 'token-1', expires_in: 300 }
jest.mock('../data/tokenStore/redisTokenStore')

jest
  .spyOn(HmppsAuthClient.prototype, 'getSystemClientToken')
  .mockImplementation(() => Promise.resolve(token.access_token))
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
tokenStore.getToken.mockResolvedValue(token.access_token)

const sentencesMock = {
  sentences: [
    {
      eventId: 12345,
      mainOffence: {
        code: '18502',
        description: 'Breach of Restraining Order (Protection from Harassment Act 1997) - 00831',
      },
      order: {
        description: '12 month Community order',
        endDate: '2024-12-01',
        startDate: '2023-12-01',
      },
    },
  ],
} as unknown as Sentences

const res = {
  locals: {
    user: {
      username: 'user-1',
    },
  },
  redirect: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const nextSpy = jest.fn()

const crn = 'X000001'
const number = '2'

jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const spy = jest.spyOn(MasApiClient.prototype, 'getSentences').mockImplementation(() => Promise.resolve(sentencesMock))

const hmppsAuthClient = new HmppsAuthClient(tokenStore)

describe('/middleware/getSentences', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('Sentences session is not defined', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
      },
      query: {
        number,
      },
      session: {
        data: {
          sentences: {
            X000002: sentencesMock.sentences,
          },
        },
      },
    })
    beforeEach(async () => {
      await getSentences(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the sentences from the api', () => {
      expect(spy).toHaveBeenCalledWith(crn, number, false)
    })
    it('should add the api response to the session', () => {
      expect(req.session.data.sentences).toEqual({
        ...req.session.data.sentences,
        [crn]: sentencesMock.sentences,
      })
    })
    it('should assign the sentence to res.locals.sentences', () => {
      expect(res.locals.sentences).toEqual(sentencesMock.sentences)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })

  describe('Sentences session is defined', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
      },
      query: {
        number,
      },
      session: {
        data: {
          sentences: {
            X000001: sentencesMock.sentences,
          },
        },
      },
    })
    beforeEach(async () => {
      await getSentences(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should not request the sentences from the api', () => {
      expect(spy).not.toHaveBeenCalled()
    })
    it('should assign the sentence to res.locals.sentences', () => {
      expect(res.locals.sentences).toEqual(req.session.data.sentences[crn])
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })
})
