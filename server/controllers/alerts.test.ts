import httpMocks from 'node-mocks-http'
import controllers from '.'
import MasApiClient from '../data/masApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import ArnsApiClient from '../data/arnsApiClient'
import { mockAppResponse } from './mocks'
import { mockClearAlertsSuccess, defaultUser } from './mocks/alerts'
import { apiErrors } from '../properties'
import { UserAlerts } from '../models/Alerts'
import logger from '../../logger'

jest.mock('../data/masApiClient')
jest.mock('../data/arnsApiClient')

let toRoshWidgetSpy: jest.Mock

jest.mock('../utils', () => ({
  get toRoshWidget() {
    return toRoshWidgetSpy
  },
}))

toRoshWidgetSpy = jest.fn()

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

const mockUserAlertsWithCrn = {
  content: [
    {
      id: 1,
      crn: 'X123456',
      type: { description: 'Mock Type', editable: true },
      name: { forename: 'Mock', middleName: '', surname: 'Case' },
      date: '2025-10-26',
      officer: { name: { forename: 'Mock', middleName: '', surname: 'Officer' }, code: 'MO01' },
    },
    {
      id: 2,
      crn: 'Y789012',
      type: { description: 'Another Type', editable: true },
      name: { forename: 'Another', middleName: '', surname: 'Case' },
      date: '2025-10-25',
      officer: { name: { forename: 'Mock', middleName: '', surname: 'Officer' }, code: 'MO01' },
    },
  ],
  totalResults: 2,
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

const mockErrorSummary = {
  errors: [
    {
      text: apiErrors.risks,
    },
    { text: 'A different unique error' },
    {
      text: 'OASys is experiencing technical difficulties. It has not been possible to provide the Risk information held in OASys',
    },
  ],
} as any

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue('token-alerts')

const getUserAlertsSpy = jest
  .spyOn(MasApiClient.prototype, 'getUserAlerts')
  .mockImplementation(() => Promise.resolve(mockUserAlertsWithCrn))
const clearAlertsSpy = jest
  .spyOn(MasApiClient.prototype, 'clearAlerts')
  .mockImplementation(() => Promise.resolve(mockClearAlertsSuccess)) // Use imported mock
const getRisksSpy = jest.spyOn(ArnsApiClient.prototype, 'getRisks')

const url = '/alerts'

describe('alertsController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getRisksSpy.mockImplementation(() => Promise.resolve(mockRisksData))
    toRoshWidgetSpy.mockClear()
    toRoshWidgetSpy.mockReturnValue(mockRoshWidget)
    getUserAlertsSpy.mockResolvedValue(mockUserAlertsWithCrn)
  })

  describe('getAlerts', () => {
    const req = httpMocks.createRequest({ query: {}, url })

    describe('risks on alerts feature flag is enabled', () => {
      const res = mockAppResponse({ flags: { enableRiskOnAlertsDashboard: true } })
      const renderSpy = jest.spyOn(res, 'render')
      it('should render the alerts page when risks api request returns a 500 error', async () => {
        const errorResponse = { status: 500, statusCode: 500, errors: [{ text: apiErrors.risks }] }
        getRisksSpy.mockImplementation(() => Promise.resolve(errorResponse))
        await controllers.alerts.getAlerts(hmppsAuthClient)(req, res)
        const expectedCrnToRiskWidgetMap = {
          X123456: apiErrors.risks,
          Y789012: apiErrors.risks,
        }
        const expectedRiskErrors = [{ text: apiErrors.risks }]
        expect(renderSpy).toHaveBeenCalledWith('pages/alerts', {
          url: encodeURIComponent(url),
          alertsData: mockUserAlertsWithCrn,
          crnToRiskWidgetMap: expectedCrnToRiskWidgetMap,
          risksErrors: expectedRiskErrors,
          sortedBy: 'date_and_time.desc',
          note: false,
          unencodedUrl: url,
        })
      })

      it('should render the alerts page when risks api request throws an error', async () => {
        const loggerSpy = jest.spyOn(logger, 'error')
        const expectedCrnToRiskWidgetMap = {}
        const mockErrorMessage = 'Mock error message'
        getRisksSpy.mockImplementationOnce(() => Promise.reject(new Error(mockErrorMessage)))
        await controllers.alerts.getAlerts(hmppsAuthClient)(req, res)
        const expectedRiskErrors = [{ text: apiErrors.risks }]
        expect(loggerSpy).toHaveBeenCalledWith(mockErrorMessage)
        expect(renderSpy).toHaveBeenCalledWith('pages/alerts', {
          url: encodeURIComponent(url),
          alertsData: mockUserAlertsWithCrn,
          crnToRiskWidgetMap: expectedCrnToRiskWidgetMap,
          risksErrors: expectedRiskErrors,
          sortedBy: 'date_and_time.desc',
          note: false,
          unencodedUrl: url,
        })
      })

      it('should render the alerts page when no alerts are returned from the api', async () => {
        const mockResponse: UserAlerts = {
          ...mockUserAlertsWithCrn,
          content: [],
        }
        getUserAlertsSpy.mockImplementationOnce(() => Promise.resolve(mockResponse))
        await controllers.alerts.getAlerts(hmppsAuthClient)(req, res)
        expect(renderSpy).toHaveBeenCalledWith('pages/alerts', {
          url: encodeURIComponent(url),
          alertsData: mockResponse,
          crnToRiskWidgetMap: {},
          sortedBy: 'date_and_time.desc',
          risksErrors: [],
          note: false,
          unencodedUrl: url,
        })
      })

      it('should render the alerts page when alerts are returned from the api', async () => {
        await controllers.alerts.getAlerts(hmppsAuthClient)(req, res)
        const expectedCrnToRiskWidgetMap = {
          X123456: mockRoshWidget,
          Y789012: mockRoshWidget,
        }
        expect(renderSpy).toHaveBeenCalledWith('pages/alerts', {
          url: encodeURIComponent(url),
          alertsData: mockUserAlertsWithCrn,
          crnToRiskWidgetMap: expectedCrnToRiskWidgetMap,
          sortedBy: 'date_and_time.desc',
          risksErrors: [],
          note: false,
          unencodedUrl: url,
        })
      })
      it('should render the alerts page if sort params are in url query', async () => {
        const sortBy = 'name'
        const sortOrder = 'desc'
        const mockReq = httpMocks.createRequest({ query: { sortBy, sortOrder }, url })
        const expectedCrnToRiskWidgetMap = {
          X123456: mockRoshWidget,
          Y789012: mockRoshWidget,
        }
        await controllers.alerts.getAlerts(hmppsAuthClient)(mockReq, res)
        expect(renderSpy).toHaveBeenCalledWith('pages/alerts', {
          url: encodeURIComponent(url),
          alertsData: mockUserAlertsWithCrn,
          crnToRiskWidgetMap: expectedCrnToRiskWidgetMap,
          risksErrors: [],
          sortedBy: 'name',
          note: false,
          unencodedUrl: url,
        })
      })
    })

    describe('risks on alerts feature flag is disabled', () => {
      const res = mockAppResponse({ flags: { enableRiskOnAlertsDashboard: false } })
      const renderSpy = jest.spyOn(res, 'render')
      it('should not request the risks from the api', async () => {
        await controllers.alerts.getAlerts(hmppsAuthClient)(req, res)
        expect(getRisksSpy).not.toHaveBeenCalled()
        expect(renderSpy).toHaveBeenCalledWith('pages/alerts', {
          url: encodeURIComponent(url),
          alertsData: mockUserAlertsWithCrn,
          crnToRiskWidgetMap: {},
          risksErrors: [],
          sortedBy: 'date_and_time.desc',
          note: false,
          unencodedUrl: url,
        })
      })
    })
  })

  describe('clearSelectedAlerts', () => {
    const res = mockAppResponse()
    const nextSpy = jest.fn()

    it('should call clearAlerts with a single selected alert and return success', async () => {
      const req = httpMocks.createRequest({ method: 'POST', body: { selectedAlerts: '123' }, url: '/alerts/clear' })
      res.locals.user = defaultUser
      res.locals.flags = {}
      clearAlertsSpy.mockResolvedValueOnce({ success: true, clearedCount: 1 })
      await controllers.alerts.clearSelectedAlerts(hmppsAuthClient)(req, res, nextSpy)
      expect(clearAlertsSpy).toHaveBeenCalledWith([123])
      expect(res.locals.alertsCleared).toEqual({ error: false, message: `You've cleared 1 alert.` })
      expect(nextSpy).toHaveBeenCalled()
    })

    it('should call clearAlerts with multiple selected alerts and return success', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        body: { selectedAlerts: ['456', '789'] },
        url: '/alerts',
      })
      res.locals.user = defaultUser
      res.locals.flags = {}
      clearAlertsSpy.mockResolvedValueOnce({ success: true, clearedCount: 2 })
      await controllers.alerts.clearSelectedAlerts(hmppsAuthClient)(req, res, nextSpy)
      expect(clearAlertsSpy).toHaveBeenCalledWith([456, 789])
      expect(res.locals.alertsCleared).toEqual({ error: false, message: `You've cleared 2 alerts.` })
      expect(nextSpy).toHaveBeenCalled()
    })

    it('should return an error and call next if no alerts are selected (Error Path)', async () => {
      const reqEmpty = httpMocks.createRequest({ method: 'POST', body: { selectedAlerts: [] }, url: '/alerts/clear' })
      res.locals.user = defaultUser
      res.locals.flags = {}
      await controllers.alerts.clearSelectedAlerts(hmppsAuthClient)(reqEmpty, res, nextSpy)
      expect(res.locals.alertsCleared).toEqual({ error: true, message: `Select an alert to clear it.` })
      expect(clearAlertsSpy).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalledTimes(1)
      nextSpy.mockClear()
      const reqMissing = httpMocks.createRequest({ method: 'POST', body: {}, url: '/alerts/clear' })
      await controllers.alerts.clearSelectedAlerts(hmppsAuthClient)(reqMissing, res, nextSpy)
      expect(res.locals.alertsCleared).toEqual({ error: true, message: `Select an alert to clear it.` })
      expect(clearAlertsSpy).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
})
