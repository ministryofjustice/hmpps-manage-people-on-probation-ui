import httpMocks from 'node-mocks-http'
import { DateTime } from 'luxon'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { getUserAlertsCount } from './getUserAlertsCount'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse } from '../controllers/mocks'
import { UserAlerts, UserAlertsCount } from '../models/Alerts'
import { AlertsCountCache } from '../@types/express'
import { AppResponse } from '../models/Locals'

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

const nextSpy = jest.fn()
const getUserAlertsCountSpy = jest.spyOn(MasApiClient.prototype, 'getUserAlertsCount')
const getUserAlertsCountV2Spy = jest.spyOn(MasApiClient.prototype, 'getUserAlertsCountV2')

const config = {
  alertsCountCacheMinutes: 5,
}

const mockResponse = ({ enableAlertsCountCaching = true, alertsCleared = null } = {}): AppResponse => {
  const locals = {
    flags: {
      enableAlertsCountCaching,
    },
    alertsCleared,
  }
  return mockAppResponse(locals)
}

const mockRequest = ({ alertsCount = null }: { alertsCount?: AlertsCountCache } = {}): httpMocks.MockRequest<any> => {
  const req = {
    session: {
      cache: {
        alertsCount,
      },
    },
  }
  return httpMocks.createRequest(req)
}

describe('/middleware/getUserAlertsCount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
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
  afterEach(() => {
    jest.useRealTimers()
  })

  describe('when the enableAlertsCountApi flag is on', () => {
    const req = httpMocks.createRequest()
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

  describe('enableAlertsCountCaching feature flag enabled', () => {
    it('should request the alerts count from the api if no cache exists', async () => {
      jest.setSystemTime(new Date('2026-09-01T12:00:00Z'))
      const expectedTimestamp = DateTime.now().plus({ minutes: config.alertsCountCacheMinutes }).toMillis()
      const req = mockRequest()
      const res = mockResponse()
      getUserAlertsCountSpy.mockImplementationOnce(() =>
        Promise.resolve({
          totalResults: 100,
        } as UserAlerts),
      )
      await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
      expect(getUserAlertsCountSpy).toHaveBeenCalledWith()
      expect(req.session.cache.alertsCount).toStrictEqual({ value: '99+', expiresAt: expectedTimestamp })
      expect(res.locals.alertsCount).toEqual('99+')
      expect(nextSpy).toHaveBeenCalledWith()
    })

    it('should request the alerts count from the api if alerts have been cleared', async () => {
      jest.setSystemTime(new Date('2026-09-01T12:00:00Z'))
      const expectedTimestamp = DateTime.now().plus({ minutes: config.alertsCountCacheMinutes }).toMillis()
      const expiresAt = DateTime.fromISO('2026-09-01T12:05:00Z').toMillis()
      const alertsCount: AlertsCountCache = { value: '90', expiresAt }
      const req = mockRequest({ alertsCount })
      const res = mockResponse({ alertsCleared: { message: 'Alerts cleared', error: false } })
      getUserAlertsCountSpy.mockImplementationOnce(() =>
        Promise.resolve({
          totalResults: 100,
        } as UserAlerts),
      )
      await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
      expect(getUserAlertsCountSpy).toHaveBeenCalledWith()
      expect(req.session.cache.alertsCount).toStrictEqual({ value: '99+', expiresAt: expectedTimestamp })
      expect(res.locals.alertsCount).toEqual('99+')
      expect(nextSpy).toHaveBeenCalledWith()
    })

    it('should request the alerts count from the api if cache has expired', async () => {
      jest.setSystemTime(new Date('2026-09-01T12:00:00Z'))
      getUserAlertsCountSpy.mockImplementationOnce(() =>
        Promise.resolve({
          totalResults: 120,
        } as UserAlerts),
      )
      const expiresAt = DateTime.fromISO('2026-09-01T11:50:00Z').toMillis()
      const alertsCount: AlertsCountCache = { value: '80', expiresAt }
      const req = mockRequest({ alertsCount })
      const res = mockResponse()
      const expectedTimestamp = DateTime.now().plus({ minutes: config.alertsCountCacheMinutes }).toMillis()
      await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
      expect(getUserAlertsCountSpy).toHaveBeenCalledWith()
      expect(req.session.cache.alertsCount).toStrictEqual({ value: '99+', expiresAt: expectedTimestamp })
      expect(res.locals.alertsCount).toEqual('99+')
      expect(nextSpy).toHaveBeenCalledWith()
    })

    it('should use the cached alerts count if cache has not expired', async () => {
      jest.setSystemTime(new Date('2026-09-01T12:00:00Z'))
      const expiresAt = DateTime.fromISO('2026-09-01T12:05:00Z').toMillis()
      const alertsCount: AlertsCountCache = { value: '90', expiresAt }
      const req = mockRequest({ alertsCount })
      const res = mockResponse()
      await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
      expect(getUserAlertsCountSpy).not.toHaveBeenCalled()
      expect(res.locals.alertsCount).toEqual('90')
    })

    it('should assign error message to alertsCount if error recieved from API', async () => {
      getUserAlertsCountSpy.mockImplementationOnce(() =>
        Promise.resolve({
          errors: [{ text: 'error message' }],
        } as unknown as UserAlerts),
      )
      const req = mockRequest()
      const res = mockResponse()
      await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
      expect(nextSpy).toHaveBeenCalled()
      expect(res.locals.alertsCount).toEqual({
        errors: [{ text: 'error message' }],
      })
    })
  })

  describe('enableAlertsCountCaching feature flag disabled', () => {
    const req = httpMocks.createRequest()
    const res = mockResponse({ enableAlertsCountCaching: false })
    it('should assign the alerts count to res.locals.alertsCount', async () => {
      getUserAlertsCountSpy.mockImplementation(() =>
        Promise.resolve({
          totalResults: 0,
        } as UserAlerts),
      )
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

    it('should assign error message to alertsCount if server returns an error', async () => {
      getUserAlertsCountSpy.mockImplementationOnce(() => Promise.reject(new Error('Server error')))
      await getUserAlertsCount(hmppsAuthClient)(req, res, nextSpy)
      expect(nextSpy).toHaveBeenCalled()
      expect(res.locals.alertsCount).toEqual({
        errors: [{ text: 'Alerts are currently unavailable. You can view them on NDelius.' }],
      })
    })
  })
})
