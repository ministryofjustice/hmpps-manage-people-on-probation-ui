import httpMocks from 'node-mocks-http'
import controllers from '.'
import MasApiClient from '../data/masApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import ArnsApiClient from '../data/arnsApiClient'
import * as Utils from '../utils'
import { mockAppResponse } from './mocks'

import { mockClearAlertsSuccess, defaultUser } from './mocks/alerts'

jest.mock('../data/masApiClient')
jest.mock('../data/arnsApiClient')
jest.mock('../utils')
jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-alerts')),
    }
  })
})
jest.mock('../data/tokenStore/redisTokenStore')

const mockRoshWidget = {
  overallRisk: 'HIGH',
  assessedOn: '2025-11-19',
  risks: [{ riskTo: 'General Public', community: ['HIGH'], custody: ['MEDIUM'] }],
} as any

const mockCrnToRiskWidgetMap = { X123456: mockRoshWidget }

const mockUserAlertsWithCrn = {
  content: [
    {
      id: 1,
      crn: 'X123456',
      type: { description: 'Mock Type', editable: true },
      date: '2025-10-26',
      officer: { name: { forename: 'Mock', middleName: '', surname: 'Officer' }, code: 'MO01' },
    },
  ],
  totalResults: 1,
  totalPages: 1,
  page: 0,
  size: 10,
}

const mockRisksData = {
  summary: {
    overallRiskLevel: 'LOW',
  },
  assessedOn: '2025-11-19',
} as any

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue('token-alerts')

const getUserAlertsSpy = jest
  .spyOn(MasApiClient.prototype, 'getUserAlerts')
  .mockImplementation(() => Promise.resolve(mockUserAlertsWithCrn))
const clearAlertsSpy = jest
  .spyOn(MasApiClient.prototype, 'clearAlerts')
  .mockImplementation(() => Promise.resolve(mockClearAlertsSuccess))

const getRisksSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getRisks')
  .mockImplementation(() => Promise.resolve(mockRisksData))

const toRoshWidgetSpy = jest.spyOn(Utils, 'toRoshWidget').mockReturnValue(mockRoshWidget) // Returns the structurally correct DTO mock

const res = mockAppResponse()
const renderSpy = jest.spyOn(res, 'render')
const jsonSpy = jest.spyOn(res, 'json')
const statusSpy = jest.spyOn(res, 'status')
const next = jest.fn()

describe('alertsController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getAlerts', () => {
    it('should call getUserAlerts with default page 0 and no sort params, and render the page', async () => {
      const req = httpMocks.createRequest({ query: {}, url: '/alerts' })
      res.locals.user = defaultUser

      await controllers.alerts.getAlerts(hmppsAuthClient)(req, res, next)

      expect(getUserAlertsSpy).toHaveBeenCalledWith(0, undefined, undefined)
      expect(getRisksSpy).toHaveBeenCalledWith('X123456')
      expect(toRoshWidgetSpy).toHaveBeenCalledWith(mockRisksData)

      expect(renderSpy).toHaveBeenCalledWith('pages/alerts', {
        alertsData: mockUserAlertsWithCrn,
        crnToRiskWidgetMap: mockCrnToRiskWidgetMap,
        sortQueryString: '',
        currentSort: { column: undefined, order: undefined },
      })
    })

    it('should call getUserAlerts with custom page number and sort params, and build query string', async () => {
      const req = httpMocks.createRequest({
        query: { page: '5', sortBy: 'date', sortOrder: 'desc' },
        url: '/alerts',
      })
      res.locals.user = defaultUser

      await controllers.alerts.getAlerts(hmppsAuthClient)(req, res, next)

      expect(getUserAlertsSpy).toHaveBeenCalledWith(5, 'date', 'desc')
      expect(getRisksSpy).toHaveBeenCalledWith('X123456')
      expect(toRoshWidgetSpy).toHaveBeenCalledWith(mockRisksData)

      expect(renderSpy).toHaveBeenCalledWith('pages/alerts', {
        alertsData: mockUserAlertsWithCrn,
        crnToRiskWidgetMap: mockCrnToRiskWidgetMap,
        sortQueryString: '&sortBy=date&sortOrder=desc',
        currentSort: { column: 'date', order: 'desc' },
      })
    })
  })

  describe('clearSelectedAlerts', () => {
    it('should return a 400 error if no alerts are selected', async () => {
      const req = httpMocks.createRequest({ method: 'POST', body: { selectedAlerts: [] }, url: '/alerts/clear' })
      res.locals.user = defaultUser

      await controllers.alerts.clearSelectedAlerts(hmppsAuthClient)(req, res, next)

      expect(statusSpy).toHaveBeenCalledWith(400)
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'No alerts selected' })
      expect(clearAlertsSpy).not.toHaveBeenCalled()
    })

    it('should call clearAlerts with a single selected alert and return success', async () => {
      const req = httpMocks.createRequest({ method: 'POST', body: { selectedAlerts: '123' }, url: '/alerts/clear' })
      res.locals.user = defaultUser

      clearAlertsSpy.mockResolvedValueOnce({ success: true, clearedCount: 1 })

      await controllers.alerts.clearSelectedAlerts(hmppsAuthClient)(req, res, next)

      expect(clearAlertsSpy).toHaveBeenCalledWith([123])
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: '1 alert(s) cleared successfully',
      })
    })

    it('should call clearAlerts with multiple selected alerts and return success', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        body: { selectedAlerts: ['456', '789'] },
        url: '/alerts',
      })
      res.locals.user = defaultUser

      clearAlertsSpy.mockResolvedValueOnce({ success: true, clearedCount: 2 })

      await controllers.alerts.clearSelectedAlerts(hmppsAuthClient)(req, res, next)

      expect(clearAlertsSpy).toHaveBeenCalledWith([456, 789])
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: '2 alert(s) cleared successfully',
      })
    })
  })
})
