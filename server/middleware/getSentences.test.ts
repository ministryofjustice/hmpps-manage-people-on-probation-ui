import httpMocks from 'node-mocks-http'
import nock from 'nock'
import { getSentences } from './getSentences'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import { HmppsAuthClient } from '../data'
import { AppResponse } from '../@types'
import config from '../config'

config.apis.masApi.url = 'http://localhost:8100'
const token = { access_token: 'token-1', expires_in: 300 }
jest.mock('../data/tokenStore/redisTokenStore')

jest
  .spyOn(HmppsAuthClient.prototype, 'getSystemClientToken')
  .mockImplementation(() => Promise.resolve(token.access_token))
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
tokenStore.getToken.mockResolvedValue(token.access_token)

const sentencesMock = [
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
] as any

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

const hmppsAuthClient = new HmppsAuthClient(tokenStore)
describe('/middleware/getSentences', () => {
  /*
  describe('200 response', () => {
    const spy = jest
      .spyOn(MasApiClient.prototype, 'getSentences')
      .mockImplementationOnce(() => Promise.resolve({ sentences: sentencesMock } as any))

    it('assign the response to session and to locals variable if 200 response', async () => {
      const req = httpMocks.createRequest({
        params: {
          crn,
        },
        query: {
          number,
        },
        session: {},
      })
      await getSentences(hmppsAuthClient)(req, res, nextSpy)
      expect(spy).toHaveBeenCalledWith(req.params.crn, req.query.number)
      expect(req.session.data).toEqual({
        sentences: {
          [req.params.crn]: sentencesMock,
        },
      })
      expect(res.locals.sentences).toEqual(sentencesMock)
      expect(nextSpy).toHaveBeenCalled()
    })
  })
    */

  describe('500 response', () => {
    let fakeApi: nock.Scope

    // beforeEach(() => {
    //   fakeApi = nock(config.apis.masApi.url, {
    //     reqheaders: {
    //       authorization: `Bearer ${token.access_token}`,
    //     },
    //   })
    // })
    beforeEach(() => {
      nock.disableNetConnect()
      nock.enableNetConnect('localhost')
      nock('http://localhost:8100')
        .get('/sentences/X000001', {
          reqheaders: {
            authorization: `Bearer ${token.access_token}`,
          },
        })
        .query({ number: '2' })
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(500, { message: 'Internal Server Error' })
    })
    afterEach(() => {
      nock.abortPendingRequests()
      nock.cleanAll()
    })

    // const spy = jest
    //   .spyOn(MasApiClient.prototype, 'getSentences')
    //   .mockImplementationOnce(() => Promise.reject(new Error()))

    it('should...', async () => {
      const req = httpMocks.createRequest({
        params: {
          crn,
        },
        query: {
          number,
        },
        session: {},
      })
      await getSentences(hmppsAuthClient)(req, res, nextSpy)
      expect(res.locals.sentences).toBeUndefined()
    })
  })
})
