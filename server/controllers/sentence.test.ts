import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import { checkAuditMessage } from './testutils'
import { toPredictors, toRoshWidget } from '../utils/utils'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient, { RiskSummary } from '../data/arnsApiClient'
import { mockAppResponse, mockTierCalculation, mockRisks, mockSentenceDetails, mockPredictors } from './mocks'

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
const res = mockAppResponse()
const renderSpy = jest.spyOn(res, 'render')
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

const getSentenceDetailsSpy = jest
  .spyOn(MasApiClient.prototype, 'getSentenceDetails')
  .mockImplementation(() => Promise.resolve(mockSentenceDetails))
const getRisksSpy = jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockImplementation(() => Promise.resolve(mockRisks))
const tierCalculationSpy = jest
  .spyOn(TierApiClient.prototype, 'getCalculationDetails')
  .mockImplementation(() => Promise.resolve(mockTierCalculation))
const predictorsSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getPredictorsAll')
  .mockImplementation(() => Promise.resolve(mockPredictors))
describe('riskController', () => {
  const req = httpMocks.createRequest({
    params: {
      crn,
    },
    query: {
      activeSentence: '',
      number: '1',
    },
  })

  describe('sentenceController', () => {
    describe('getSentence', () => {
      beforeEach(async () => {
        await controllers.sentence.getSentence(hmppsAuthClient)(req, res)
      })
      checkAuditMessage(res, 'VIEW_MAS_SENTENCE', uuidv4(), crn, 'CRN')
      it('should request the page data from the api', () => {
        expect(getSentenceDetailsSpy).toHaveBeenCalledWith(crn, '?activeSentence=true&number=1')
        expect(getRisksSpy).toHaveBeenCalledWith(crn)
        expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
        expect(predictorsSpy).toHaveBeenCalledWith(crn)
      })
      it('should render the sentence page', () => {
        expect(renderSpy).toHaveBeenCalledWith('pages/sentence', {
          sentenceDetails: mockSentenceDetails,
          crn,
          tierCalculation: mockTierCalculation,
          risksWidget: toRoshWidget(mockRisks),
          predictorScores: toPredictors(mockPredictors),
        })
      })
    })
  })
})
