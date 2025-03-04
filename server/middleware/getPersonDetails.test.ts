import httpMocks from 'node-mocks-http'
import { getPersonalDetails } from './getPersonalDetails'
import { AppResponse } from '../@types'
import MasApiClient from '../data/masApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>

jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const spy = jest
  .spyOn(MasApiClient.prototype, 'getPersonalDetails')
  .mockImplementation(() => Promise.resolve(mock('X000002')))
const hmppsAuthClient = new HmppsAuthClient(tokenStore)

const mock = (crn = 'X000001') =>
  ({
    personSummary: {
      name: {
        forename: 'Caroline',
        surname: 'Wolff',
      },
      crn,
      dateOfBirth: '1979-08-18',
    },
  }) as any

const res = {
  locals: {
    user: {
      username: 'user-1',
    },
  },
  redirect: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const nextSpy = jest.fn()

describe('/middleware/getPersonDetails', () => {
  it('should request data from the api if personal details for crn does not exist in the session', async () => {
    const req = httpMocks.createRequest({
      params: {
        crn: 'X000002',
      },
      session: {
        data: {
          personalDetails: {
            X000001: mock(),
          },
        },
      },
    })
    await getPersonalDetails(hmppsAuthClient)(req, res, nextSpy)
    const expected = {
      personalDetails: {
        X000001: mock(),
        X000002: mock('X000002'),
      },
    }
    expect(req.session.data).toEqual(expected)
    expect(spy).toHaveBeenCalledWith(req.params.crn)
    expect(res.locals.case).toEqual(mock('X000002'))
    expect(nextSpy).toHaveBeenCalled()
    spy.mockRestore()
  })
  it('should not request data from the api if personal details for crn exists in the session', async () => {
    const req = httpMocks.createRequest({
      params: {
        crn: 'X000001',
      },
      session: {
        data: {
          personalDetails: {
            X000001: mock(),
          },
        },
      },
    })
    await getPersonalDetails(hmppsAuthClient)(req, res, nextSpy)
    expect(spy).not.toHaveBeenCalled()
    expect(res.locals.case).toEqual(mock())
    expect(nextSpy).toHaveBeenCalled()
  })
})
