import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import { checkAuditMessage } from './testutils'
import { toPredictors, toRoshWidget } from '../utils'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import {
  mockAppResponse,
  mockTierCalculation,
  mockRisks,
  mockPersonRiskFlags,
  mockPersonRiskFlag,
  mockPredictors,
  mockNeeds,
} from './mocks'
import config from '../config'

jest.mock('../data/masApiClient')
jest.mock('../data/interventionsApiClient')
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
const id = '1234'
const res = mockAppResponse()
const renderSpy = jest.spyOn(res, 'render')
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

const getPersonRiskFlagsSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonRiskFlags')
  .mockImplementation(() => Promise.resolve(mockPersonRiskFlags))
const getPersonRiskFlagSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonRiskFlag')
  .mockImplementation(() => Promise.resolve(mockPersonRiskFlag))
const getRisksSpy = jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockImplementation(() => Promise.resolve(mockRisks))
const tierCalculationSpy = jest
  .spyOn(TierApiClient.prototype, 'getCalculationDetails')
  .mockImplementation(() => Promise.resolve(mockTierCalculation))
const predictorsSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getPredictorsAll')
  .mockImplementation(() => Promise.resolve(mockPredictors))
const needsSpy = jest.spyOn(ArnsApiClient.prototype, 'getNeeds').mockImplementation(() => Promise.resolve(mockNeeds))
const req = httpMocks.createRequest({
  params: {
    crn,
    id,
  },
})
describe('riskController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('getRisk', () => {
    beforeEach(async () => {
      await controllers.risk.getRisk(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_RISKS', uuidv4(), crn, 'CRN')
    it('should request the page data from the api', () => {
      expect(getPersonRiskFlagsSpy).toHaveBeenCalledWith(crn)
      expect(getRisksSpy).toHaveBeenCalledWith(crn)
      expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
      expect(predictorsSpy).toHaveBeenCalledWith(crn)
      expect(needsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the risk page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/risk', {
        personRisk: mockPersonRiskFlags,
        risks: mockRisks,
        crn,
        tierCalculation: mockTierCalculation,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
        timeline: [],
        needs: mockNeeds,
        oasysLink: config.oaSys.link,
      })
    })
  })
  describe('getRiskFlag', () => {
    beforeEach(async () => {
      await controllers.risk.getRiskFlag(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_RISK_DETAIL', uuidv4(), crn, 'CRN')
    it('should request the person risk flag from the api', () => {
      expect(getPersonRiskFlagSpy).toHaveBeenCalledWith(crn, id)
    })
    it('should render the person risk flag page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/risk/flag', {
        personRiskFlag: mockPersonRiskFlag,
        crn,
      })
    })
  })
  describe('getRemovedRiskFlags', () => {
    beforeEach(async () => {
      await controllers.risk.getRemovedRiskFlags(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_REMOVED_RISKS', uuidv4(), crn, 'CRN')
    it('should request the person risk flags from the api', () => {
      expect(getPersonRiskFlagsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the removed risk flags page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/risk/removed-risk-flags', {
        personRisk: mockPersonRiskFlags,
        crn,
      })
    })
  })
})
