import httpMocks from 'node-mocks-http'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { getUserAlertsCount } from './getUserAlertsCount'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse } from '../controllers/mocks'
import { UserAlerts, UserAlertsCount } from '../models/Alerts'

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

const nextSpy = jest.fn()
const getUserAlertsCountSpy = jest.spyOn(MasApiClient.prototype, 'getUserAlertsCount')
const getUserAlertsCountV2Spy = jest.spyOn(MasApiClient.prototype, 'getUserAlertsCountV2')

describe('/middleware/getUserAlertsCount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getUserAlertsCountSpy.mockImplementation(() =>
      Promise.resolve({
        totalResults: 0,
      } as UserAlerts),
    )
    getUserAlertsCountV2Spy.mockImplementation(() =>
      Promise.resolve({
        count: 0,
      } as UserAlertsCount),
    )
  })

  describe('when the enableAlertsCountApi flag is off', () => {
    const res = mockAppResponse({ flags: { enableAlertsCountApi: false } })

    it('should assign the alerts count to res.locals.alertsCount', async () => {
      await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
      expect(nextSpy).toHaveBeenCalled()
      expect(res.locals.alertsCount).toEqual('0')
      expect(getUserAlertsCountSpy).toHaveBeenCalled()
      expect(getUserAlertsCountV2Spy).not.toHaveBeenCalled()
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

    it('should assign error message to alertsCount if error received from API', async () => {
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

  describe('when the enableAlertsCountApi flag is on', () => {
    const res = mockAppResponse({ flags: { enableAlertsCountApi: true } })

    it('should assign the alerts count to res.locals.alertsCount using the count endpoint', async () => {
      await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
      expect(nextSpy).toHaveBeenCalled()
      expect(res.locals.alertsCount).toEqual('0')
      expect(getUserAlertsCountV2Spy).toHaveBeenCalled()
      expect(getUserAlertsCountSpy).not.toHaveBeenCalled()
    })

    it('should assign the alerts count to 99+ if the count is 100 or more', async () => {
      getUserAlertsCountV2Spy.mockImplementationOnce(() =>
        Promise.resolve({
          count: 100,
        } as UserAlertsCount),
      )
      await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
      expect(nextSpy).toHaveBeenCalled()
      expect(res.locals.alertsCount).toEqual('99+')
    })

    it('should assign a null alertsCount if the API returns a handled 404', async () => {
      getUserAlertsCountV2Spy.mockImplementationOnce(() => Promise.resolve(null))
      await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
      expect(nextSpy).toHaveBeenCalled()
      expect(res.locals.alertsCount).toBeNull()
    })

    it('should assign error message to alertsCount if error received from API', async () => {
      getUserAlertsCountV2Spy.mockImplementationOnce(() =>
        Promise.resolve({
          errors: [{ text: 'error message' }],
        } as unknown as UserAlertsCount),
      )
      await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
      expect(nextSpy).toHaveBeenCalled()
      expect(res.locals.alertsCount).toEqual({
        errors: [{ text: 'error message' }],
      })
    })
  })
})
