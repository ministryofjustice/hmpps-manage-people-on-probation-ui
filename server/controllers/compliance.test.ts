import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient, { Needs } from '../data/arnsApiClient'
import { mockAppResponse, mockTierCalculation, mockPredictors, mockRisks } from './mocks'
import { checkAuditMessage } from './testutils'
import { PersonCompliance } from '../data/model/compliance'
import { toPredictors, toRoshWidget } from '../utils/utils'

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
const tierCalculationSpy = jest
  .spyOn(TierApiClient.prototype, 'getCalculationDetails')
  .mockImplementation(() => Promise.resolve(mockTierCalculation))
const risksSpy = jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockImplementation(() => Promise.resolve(mockRisks))
const predictorsSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getPredictorsAll')
  .mockImplementation(() => Promise.resolve(mockPredictors))
const res = mockAppResponse()
const renderSpy = jest.spyOn(res, 'render')

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

const mockPersonCompliance = {
  personSummary: {},
  previousOrders: {},
  currentSentences: [],
} as PersonCompliance
const getPersonComplianceSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonCompliance')
  .mockImplementation(() => Promise.resolve(mockPersonCompliance))

describe('complianceController', () => {
  const req = httpMocks.createRequest({
    params: {
      crn,
    },
  })
  describe('getCompliance', () => {
    beforeEach(async () => {
      await controllers.compliance.getCompliance(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_COMPLIANCE', uuidv4(), crn, 'CRN')
    it('should request the page data from the api', () => {
      expect(getPersonComplianceSpy).toHaveBeenCalledWith(crn)
      expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
      expect(risksSpy).toHaveBeenCalledWith(crn)
      expect(predictorsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the compliance page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/compliance', {
        personCompliance: mockPersonCompliance,
        tierCalculation: mockTierCalculation,
        crn,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
      })
    })
  })
})
