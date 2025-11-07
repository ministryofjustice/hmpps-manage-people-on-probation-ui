import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import { toRoshWidget, toPredictors } from '../utils'
import {
  mockActivity,
  mockTierCalculation,
  mockActivities,
  mockActivityNote,
  mockAppResponse,
  mockRisks,
  mockPredictors,
  mockPersonAppointment,
} from './mocks'
import { checkAuditMessage } from './testutils'
import { getPersonAppointment } from '../middleware'

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const id = '1234'
const noteId = '5678'

jest.mock('../data/masApiClient')
jest.mock('../data/tokenStore/redisTokenStore')
jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})
jest.mock('../data/arnsApiClient')
jest.mock('../utils', () => ({
  toRoshWidget: jest.fn(),
  toPredictors: jest.fn(),
}))

jest.mock('@ministryofjustice/hmpps-audit-client')
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'f1654ea3-0abb-46eb-860b-654a96edbe20'),
}))

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

const getPersonActivitySpy = jest
  .spyOn(MasApiClient.prototype, 'postPersonActivityLog')
  .mockImplementation(() => Promise.resolve(mockActivities))

const getCalculationDetailsSpy = jest
  .spyOn(TierApiClient.prototype, 'getCalculationDetails')
  .mockImplementation(() => Promise.resolve(mockTierCalculation))

const getRisksSpy = jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockImplementation(() => Promise.resolve(mockRisks))

const getPredictorsSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getPredictorsAll')
  .mockImplementation(() => Promise.resolve(mockPredictors))

const getPersonAppointmentSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonAppointment')
  .mockImplementation(() => Promise.resolve(mockPersonAppointment))

const req = httpMocks.createRequest({
  params: {
    crn,
    id,
    noteId,
  },
  query: { page: '', view: 'default', requirement: '' },
  session: {
    activityLogFilters: { page: '', view: 'default', requirement: '' },
  },
})

const reqCompact = httpMocks.createRequest({
  params: {
    crn,
    id,
    noteId,
  },
  query: { page: '', view: 'compact', requirement: '' },
  session: {
    activityLogFilters: { page: '', view: 'compact', requirement: '' },
  },
})

const reqDefault = httpMocks.createRequest({
  params: {
    crn,
    id,
    noteId,
  },
  query: { page: '', requirement: '' },
  session: {
    activityLogFilters: { page: '', view: 'default', requirement: '' },
  },
})

const res = mockAppResponse({
  filters: {
    dateFrom: '',
    dateTo: '',
    keywords: '',
  },
})

const renderSpy = jest.spyOn(res, 'render')

describe('/controllers/activityLogController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('getOrPostActivityLog', () => {
    beforeEach(async () => {
      await controllers.activityLog.getOrPostActivityLog(hmppsAuthClient)(req, res)
    })
    it('should set res.locals.compactView to true', async () => {
      await controllers.activityLog.getOrPostActivityLog(hmppsAuthClient)(reqCompact, res)
      expect(res.locals.compactView).toEqual(true)
    })
    it('should set res.locals.defaultView to true', async () => {
      await controllers.activityLog.getOrPostActivityLog(hmppsAuthClient)(reqDefault, res)
      expect(res.locals.defaultView).toEqual(true)
    })
    checkAuditMessage(res, 'VIEW_MAS_ACTIVITY_LOG', uuidv4(), crn, 'CRN')
    it('should request the person activity from the api', () => {
      const expectedBody = {
        keywords: '',
        dateFrom: '',
        dateTo: '',
        filters: [] as string[],
      }
      expect(getPersonActivitySpy).toHaveBeenCalledWith(crn, expectedBody, req.query.page)
      expect(getCalculationDetailsSpy).toHaveBeenCalledWith(crn)
    })
    it('should request risks from api', async () => {
      expect(getRisksSpy).toHaveBeenCalledWith(crn)
    })
    it('should request all predictors from the api', () => {
      expect(getPredictorsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the activity log page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/activity-log', {
        personActivity: mockActivities,
        baseUrl: '',
        crn,
        query: req.query,
        queryParams: [],
        page: req.query.page,
        view: req.query.view,
        tierCalculation: mockTierCalculation,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
        url: req.url,
        resultsStart: 1,
        resultsEnd: 1,
      })
    })
  })
  describe('getActivity', () => {
    beforeEach(async () => {
      await controllers.activityLog.getActivity(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_ACTIVITY_LOG_DETAIL', uuidv4(), crn, 'CRN')
    it('should request the person appointment note', () => {
      expect(getPersonAppointmentSpy).toHaveBeenCalledWith(crn, id)
    })
    it('should render the activity page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/appointment', {
        personAppointment: mockPersonAppointment,
        crn,
        id,
        back: undefined,
        queryParams: ['view=default'],
        isActivityLog: true,
        url: '',
      })
    })
  })
})
