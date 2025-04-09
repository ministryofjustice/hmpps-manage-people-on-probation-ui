import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient, { Needs } from '../data/arnsApiClient'
import { mockAppResponse, mockTierCalculation, mockPredictors, mockRisks } from './mocks'
import { Overview } from '../data/model/overview'
import { PersonRiskFlags } from '../data/model/risk'
import { toPredictors, toRoshWidget } from '../utils'
import { checkAuditMessage } from './testutils'

jest.mock('../data/masApiClient')
jest.mock('../data/tokenStore/redisTokenStore')
jest.mock('@ministryofjustice/hmpps-audit-client')
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'f1654ea3-0abb-46eb-860b-654a96edbe20'),
}))

jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const mockOverview = {} as Overview
const mockNeeds = {} as Needs
const mockRiskFlags = {} as PersonRiskFlags
const getOverviewSpy = jest
  .spyOn(MasApiClient.prototype, 'getOverview')
  .mockImplementation(() => Promise.resolve(mockOverview))
const tierCalculationSpy = jest
  .spyOn(TierApiClient.prototype, 'getCalculationDetails')
  .mockImplementation(() => Promise.resolve(mockTierCalculation))
const risksSpy = jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockImplementation(() => Promise.resolve(mockRisks))
const needsSpy = jest.spyOn(ArnsApiClient.prototype, 'getNeeds').mockImplementation(() => Promise.resolve(mockNeeds))
const getPersonRiskFlagsSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonRiskFlags')
  .mockImplementation(() => Promise.resolve(mockRiskFlags))
const predictorsSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getPredictorsAll')
  .mockImplementation(() => Promise.resolve(mockPredictors))
const res = mockAppResponse()
const renderSpy = jest.spyOn(res, 'render')

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

describe('caseController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getCase', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
      },
      query: {
        sentenceNumber: '123',
      },
      url: '/caseload/appointments/upcoming',
    })
    beforeEach(async () => {
      await controllers.case.getCase(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_OVERVIEW', uuidv4(), crn, 'CRN')
    it('should request the data from the api', () => {
      expect(getOverviewSpy).toHaveBeenCalledWith(crn, req.query.sentenceNumber)
      expect(risksSpy).toHaveBeenCalledWith(crn)
      expect(needsSpy).toHaveBeenCalledWith(crn)
      expect(getPersonRiskFlagsSpy).toHaveBeenCalledWith(crn)
      expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
      expect(predictorsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the case overview page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/overview', {
        overview: mockOverview,
        needs: mockNeeds,
        personRisks: mockRiskFlags,
        risks: mockRisks,
        crn,
        tierCalculation: mockTierCalculation,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
      })
    })
  })
})
