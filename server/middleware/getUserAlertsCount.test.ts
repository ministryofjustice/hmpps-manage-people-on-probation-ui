import httpMocks from 'node-mocks-http'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { getUserAlertsCount } from './getUserAlertsCount'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse } from '../controllers/mocks'
import { UserAlerts } from '../models/Alerts'

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
    getUserAlertsCountSpy.mockImplementation(() =>
      Promise.resolve({
        totalResults: 0,
      } as UserAlerts),
    )
  })

  it('should assign the alerts count to res.locals.alertsCount', async () => {
    await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalled()
    expect(res.locals.alertsCount).toEqual('0')
  })

  it('should assign the alerts count to 99+ if the count is 100 or more', async () => {
    getUserAlertsCountSpy.mockImplementationOnce(() =>
      Promise.resolve({
        totalResults: 100,
      } as UserAlerts),
    )
    await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalled()
    expect(res.locals.alertsCount).toEqual('99+')
  })

  it('should assign error message to alertsCount if error recieved from API', async () => {
    getUserAlertsCountSpy.mockImplementationOnce(() =>
      Promise.resolve({
        errors: [{ text: 'error message' }],
      } as unknown as UserAlerts),
    )
    await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalled()
    expect(res.locals.alertsCount).toEqual({
      errors: [{ text: 'error message' }],
    })
  })
})
