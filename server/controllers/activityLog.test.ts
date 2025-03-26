import httpMocks from 'node-mocks-http'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import { toRoshWidget, toPredictors } from '../utils/utils'
import { mockActivity, mockTierCalculation, mockActivities, mockAppResponse, mockRisks, mockPredictors } from './mocks'

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const id = '1234'

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
jest.mock('../utils/utils', () => ({
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

const req = httpMocks.createRequest({
  params: {
    crn,
    id,
  },
  query: { page: '', view: 'default', requirement: '' },
})
const res = mockAppResponse({
  filters: {
    dateFrom: '',
    dateTo: '',
    keywords: '',
  },
})

const renderSpy = jest.spyOn(res, 'render')
const auditSpy = jest.spyOn(auditService, 'sendAuditMessage')

describe('/controllers/activityLogController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('getActivityLog', () => {
    beforeEach(async () => {
      await controllers.activityLog.getActivityLog(hmppsAuthClient)(req, res)
    })
    it('should set res.locals.defaultView to true', async () => {
      await controllers.activityLog.getActivityLog(hmppsAuthClient)(req, res)
      expect(res.locals.defaultView).toEqual(true)
    })
    it('should send an audit message', () => {
      expect(auditSpy).toHaveBeenCalledWith({
        action: 'VIEW_MAS_ACTIVITY_LOG',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: uuidv4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
    })
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
        crn,
        query: req.query,
        queryParams: ['view=default'],
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

  describe('getActivityDetails', () => {
    const getPersonAppointmentSpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonAppointment')
      .mockImplementation(() => Promise.resolve(mockActivity))
    beforeEach(async () => {
      await controllers.activityLog.getActivityDetails(hmppsAuthClient)(req, res)
    })
    afterEach(() => {
      jest.clearAllMocks()
    })
    it('should request the person appointment from the api', () => {
      expect(getPersonAppointmentSpy).toHaveBeenCalledWith(crn, id)
    })
    it('should request the tier calculation from the api', () => {
      expect(getCalculationDetailsSpy).toHaveBeenCalledWith(crn)
    })
    it('should request risks and predictors from the api', () => {
      expect(getRisksSpy).toHaveBeenCalledWith(crn)
      expect(getPredictorsSpy).toHaveBeenCalledWith(crn)
    })
    it('should send an audit message', () => {
      expect(auditSpy).toHaveBeenCalledWith({
        action: 'VIEW_MAS_ACTIVITY_LOG_DETAIL',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: uuidv4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
    })
    it('should render the appointment page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/appointment', {
        category: req.query.category,
        queryParams: ['view=default'],
        personAppointment: mockActivity,
        crn,
        isActivityLog: true,
        tierCalculation: mockTierCalculation,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
      })
    })
  })
})
