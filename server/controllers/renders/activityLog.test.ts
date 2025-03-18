import httpMocks from 'node-mocks-http'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 as uuidv4 } from 'uuid'
import renders from '.'
import HmppsAuthClient from '../../data/hmppsAuthClient'
import MasApiClient from '../../data/masApiClient'
import TokenStore from '../../data/tokenStore/redisTokenStore'
import { AppResponse } from '../../@types'
import TierApiClient, { TierCalculation } from '../../data/tierApiClient'
import { PersonActivity } from '../../data/model/activityLog'
import ArnsApiClient, { RiskSummary } from '../../data/arnsApiClient'
import { RiskScoresDto } from '../../data/model/risk'
import { toRoshWidget, toPredictors } from '../../utils/utils'

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const id = '1234'

export const mockTierCalculation = {
  tierScore: 'B2',
  calculationId: 'ee1f151f-7417-47f8-9366-2ced6356db37',
  calculationDate: '2023-12-07T12:05:11.524616',
  data: {
    protect: {
      tier: 'B',
      points: 33,
      pointsBreakdown: {
        RSR: 20,
        ROSH: 10,
        MAPPA: 5,
        COMPLEXITY: 2,
        ADDITIONAL_FACTORS_FOR_WOMEN: 6,
      },
    },
    change: {
      tier: 'TWO',
      points: 14,
      pointsBreakdown: {
        NEEDS: 7,
        IOM: 2,
        OGRS: 5,
      },
    },
    calculationVersion: '2',
  },
} as unknown as TierCalculation

const mockActivities = {
  size: 10,
  page: 0,
  totalResults: 1,
  totalPages: 1,
  personSummary: {
    name: {
      forename: 'Eula',
      surname: 'Schmeler',
    },
    crn: 'X000001',
    dateOfBirth: '1979-08-18',
  },
  activities: [
    {
      id: 11,
      type: 'Phone call',
      startDateTime: '2044-12-22T09:15:00.382936Z[Europe/London]',
      endDateTime: '2044-12-22T09:30:00.382936Z[Europe/London]',
      rarToolKit: 'Choices and Changes',
      rarCategory: 'Stepping Stones',
      isSensitive: false,
      hasOutcome: false,
      wasAbsent: true,
      notes: '',
      isAppointment: false,
      isCommunication: true,
      isPhoneCallFromPop: true,
    },
  ],
} as unknown as PersonActivity

export const mockRisks = {} as unknown as RiskSummary
export const mockPredictors = [] as unknown as RiskScoresDto[]

jest.mock('../../data/masApiClient')
jest.mock('../../data/tokenStore/redisTokenStore')
jest.mock('../../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})
jest.mock('../../data/arnsApiClient')
jest.mock('../../utils/utils', () => ({
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
const res = {
  locals: {
    user: {
      username: 'user-1',
    },
    filters: {
      dateFrom: '',
      dateTo: '',
      keywords: '',
    },
  },
  redirect: jest.fn().mockReturnThis(),
  render: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const renderSpy = jest.spyOn(res, 'render')
const auditSpy = jest.spyOn(auditService, 'sendAuditMessage')

describe('/controllers/activityLog', () => {
  beforeEach(async () => {
    await renders.activityLog(hmppsAuthClient)(req, res)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('should set res.locals.defaultView to true', async () => {
    await renders.activityLog(hmppsAuthClient)(req, res)
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
