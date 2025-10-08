import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import SentencePlanApiClient from '../data/sentencePlanApiClient'
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
  mockSanIndicatorResponse,
  mockSentencePlans,
  mockUserCaseload,
} from './mocks'
import config from '../config'
import { UserCaseload } from '../data/model/caseload'

jest.mock('../data/masApiClient')
jest.mock('../data/sentencePlanApiClient')
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

const username = 'user-1'

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const id = '1234'
const res = mockAppResponse({ user: { roles: ['SENTENCE_PLAN'] } })
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
const sanIndicatorSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getSanIndicator')
  .mockImplementation(() => Promise.resolve(mockSanIndicatorResponse))
const searchUserCaseloadSpy = jest
  .spyOn(MasApiClient.prototype, 'searchUserCaseload')
  .mockImplementation(() => Promise.resolve(mockUserCaseload))
const needsSpy = jest.spyOn(ArnsApiClient.prototype, 'getNeeds').mockImplementation(() => Promise.resolve(mockNeeds))

const req = httpMocks.createRequest({
  params: {
    crn,
    id,
  },
})
describe('riskController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('getRisk', () => {
    describe('CRN has sentence plan, user does not have SENTENCE_PLAN role, pop in users caseload', () => {
      let getPlanByCrnSpy: jest.SpyInstance
      const mockRes = mockAppResponse({ user: { username, roles: ['MANAGE_SUPERVISIONS'] } })
      const spy = jest.spyOn(mockRes, 'render')
      beforeEach(async () => {
        getPlanByCrnSpy = jest
          .spyOn(SentencePlanApiClient.prototype, 'getPlanByCrn')
          .mockImplementationOnce(() => Promise.resolve(mockSentencePlans))
        await controllers.risk.getRisk(hmppsAuthClient)(req, mockRes)
      })
      checkAuditMessage(mockRes, 'VIEW_MAS_RISKS', uuidv4(), crn, 'CRN')
      it('should request the page data from the api', () => {
        expect(getPersonRiskFlagsSpy).toHaveBeenCalledWith(crn)
        expect(getRisksSpy).toHaveBeenCalledWith(crn)
        expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
        expect(predictorsSpy).toHaveBeenCalledWith(crn)
        expect(needsSpy).toHaveBeenCalledWith(crn)
        expect(sanIndicatorSpy).toHaveBeenCalledWith(crn)
        expect(searchUserCaseloadSpy).toHaveBeenCalledWith(username, '', '', { nameOrCrn: crn })
      })
      it('should request the sentence plans from the api', () => {
        expect(getPlanByCrnSpy).toHaveBeenCalledWith(crn)
      })
      it('should render the risk page', () => {
        expect(spy).toHaveBeenCalledWith('pages/risk', {
          personRisk: mockPersonRiskFlags,
          risks: mockRisks,
          crn,
          tierCalculation: mockTierCalculation,
          risksWidget: toRoshWidget(mockRisks),
          predictorScores: toPredictors(mockPredictors),
          timeline: [],
          needs: mockNeeds,
          oasysLink: config.oaSys.link,
          sanIndicator: mockSanIndicatorResponse.sanIndicator,
          showSentencePlan: false,
          planLastUpdated: '',
        })
      })
    })

    describe('CRN has sentence plan, user has SENTENCE_PLAN role, pop in users caseload', () => {
      const mockRes = mockAppResponse({ user: { username, roles: ['MANAGE_SUPERVISIONS', 'SENTENCE_PLAN'] } })
      const spy = jest.spyOn(mockRes, 'render')
      beforeEach(async () => {
        jest
          .spyOn(SentencePlanApiClient.prototype, 'getPlanByCrn')
          .mockImplementationOnce(() => Promise.resolve(mockSentencePlans))
        await controllers.risk.getRisk(hmppsAuthClient)(req, mockRes)
      })
      it('should render the risk page', () => {
        expect(spy).toHaveBeenCalledWith('pages/risk', {
          personRisk: mockPersonRiskFlags,
          risks: mockRisks,
          crn,
          tierCalculation: mockTierCalculation,
          risksWidget: toRoshWidget(mockRisks),
          predictorScores: toPredictors(mockPredictors),
          timeline: [],
          needs: mockNeeds,
          oasysLink: config.oaSys.link,
          sanIndicator: mockSanIndicatorResponse.sanIndicator,
          showSentencePlan: true,
          planLastUpdated: '2025-09-29T10:54:36.782Z',
        })
      })
    })

    describe('CRN does not have sentence plan, user does not have SENTENCE_PLAN role, pop in users caseload', () => {
      const mockRes = mockAppResponse({ user: { username, roles: ['MANAGE_SUPERVISIONS'] } })
      const spy = jest.spyOn(mockRes, 'render')
      beforeEach(async () => {
        jest.spyOn(SentencePlanApiClient.prototype, 'getPlanByCrn').mockImplementationOnce(() => Promise.resolve([]))
        await controllers.risk.getRisk(hmppsAuthClient)(req, mockRes)
      })
      it('should render the risk page', () => {
        expect(spy).toHaveBeenCalledWith('pages/risk', {
          personRisk: mockPersonRiskFlags,
          risks: mockRisks,
          crn,
          tierCalculation: mockTierCalculation,
          risksWidget: toRoshWidget(mockRisks),
          predictorScores: toPredictors(mockPredictors),
          timeline: [],
          needs: mockNeeds,
          oasysLink: config.oaSys.link,
          sanIndicator: mockSanIndicatorResponse.sanIndicator,
          showSentencePlan: false,
          planLastUpdated: '',
        })
      })
    })

    describe('CRN does not have sentence plan, user has SENTENCE_PLAN role, pop in users caseload', () => {
      const mockRes = mockAppResponse({ user: { username, roles: ['MANAGE_SUPERVISIONS', 'SENTENCE_PLAN'] } })
      const spy = jest.spyOn(mockRes, 'render')
      beforeEach(async () => {
        jest.spyOn(SentencePlanApiClient.prototype, 'getPlanByCrn').mockImplementationOnce(() => Promise.resolve([]))
        await controllers.risk.getRisk(hmppsAuthClient)(req, mockRes)
      })
      it('should render the risk page', () => {
        expect(spy).toHaveBeenCalledWith('pages/risk', {
          personRisk: mockPersonRiskFlags,
          risks: mockRisks,
          crn,
          tierCalculation: mockTierCalculation,
          risksWidget: toRoshWidget(mockRisks),
          predictorScores: toPredictors(mockPredictors),
          timeline: [],
          needs: mockNeeds,
          oasysLink: config.oaSys.link,
          sanIndicator: mockSanIndicatorResponse.sanIndicator,
          showSentencePlan: false,
          planLastUpdated: '',
        })
      })
    })

    describe('CRN has sentence plan, user has SENTENCE_PLAN role, pop not in users caseload', () => {
      const mockRes = mockAppResponse({ user: { username, roles: ['MANAGE_SUPERVISIONS', 'SENTENCE_PLAN'] } })
      const spy = jest.spyOn(mockRes, 'render')
      const mockNoUserCaseload: UserCaseload = { ...mockUserCaseload, caseload: [] }
      beforeEach(async () => {
        jest
          .spyOn(MasApiClient.prototype, 'searchUserCaseload')
          .mockImplementationOnce(() => Promise.resolve(mockNoUserCaseload))
        jest
          .spyOn(SentencePlanApiClient.prototype, 'getPlanByCrn')
          .mockImplementationOnce(() => Promise.resolve(mockSentencePlans))
        await controllers.risk.getRisk(hmppsAuthClient)(req, mockRes)
      })
      it('should render the risk page', () => {
        expect(spy).toHaveBeenCalledWith('pages/risk', {
          personRisk: mockPersonRiskFlags,
          risks: mockRisks,
          crn,
          tierCalculation: mockTierCalculation,
          risksWidget: toRoshWidget(mockRisks),
          predictorScores: toPredictors(mockPredictors),
          timeline: [],
          needs: mockNeeds,
          oasysLink: config.oaSys.link,
          sanIndicator: mockSanIndicatorResponse.sanIndicator,
          showSentencePlan: false,
          planLastUpdated: '',
        })
      })
    })

    describe('Sentence plan api returns an error', () => {
      beforeEach(async () => {
        jest
          .spyOn(SentencePlanApiClient.prototype, 'getPlanByCrn')
          .mockImplementationOnce(() => Promise.reject(new Error()))
        await controllers.risk.getRisk(hmppsAuthClient)(req, res)
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
          sanIndicator: mockSanIndicatorResponse.sanIndicator,
          showSentencePlan: false,
          planLastUpdated: '',
        })
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
