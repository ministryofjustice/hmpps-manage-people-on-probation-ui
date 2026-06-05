import httpMocks from 'node-mocks-http'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { AppResponse } from '../models/Locals'
import { getUserAlertsCount } from './getUserAlertsCount'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse } from '../controllers/mocks'

jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-alerts')),
    }
  })
})
jest.mock('../data/tokenStore/redisTokenStore')

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue('token-alerts')

const req = httpMocks.createRequest()
const res = mockAppResponse()

const nextSpy = jest.fn()
const getUserAlertsCountSpy = jest.spyOn(MasApiClient.prototype, 'getUserAlertsCount')

describe('/middleware/getUserAlertsCount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getUserAlertsCountSpy.mockImplementation(() => Promise.resolve(1))
  })

  it('should assign the alerts count to res.locals.alertsCount', async () => {
    await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalled()
    expect(res.locals.alertsCount).toEqual('1')
  })

  it('should assign the alerts count to 99+ if the count is 100 or more', async () => {
    getUserAlertsCountSpy.mockImplementationOnce(() => Promise.resolve(100))
    await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalled()
    expect(res.locals.alertsCount).toEqual('99+')
  })

  it('should assign the alerts count to -1 if the API fails', async () => {
    getUserAlertsCountSpy.mockImplementationOnce(() => Promise.resolve(-1))
    await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalled()
    expect(res.locals.alertsCount).toEqual('-1')
  })
})
