import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import { checkAuditMessage } from './testutils'
import { toPredictors, toRoshWidget } from '../utils/utils'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import {
  mockAppResponse,
  mockTierCalculation,
  mockRisks,
  mockSentenceDetails,
  mockPredictors,
  mockProbationHistory,
  mockPreviousOrder,
  mockPreviousOrders,
  mockSentenceOffences,
  mockLicenceConditionNote,
  mockRequirementNote,
} from './mocks'

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
const eventNumber = '012'
const licenceConditionId = '345'
const requirementId = '678'
const noteId = '910'
const res = mockAppResponse()
const renderSpy = jest.spyOn(res, 'render')
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

const getSentenceDetailsSpy = jest
  .spyOn(MasApiClient.prototype, 'getSentenceDetails')
  .mockImplementation(() => Promise.resolve(mockSentenceDetails))
const getProbationHistorySpy = jest
  .spyOn(MasApiClient.prototype, 'getProbationHistory')
  .mockImplementation(() => Promise.resolve(mockProbationHistory))
const getSentencePreviousOrdersSpy = jest
  .spyOn(MasApiClient.prototype, 'getSentencePreviousOrders')
  .mockImplementation(() => Promise.resolve(mockPreviousOrders))
const getSentencePreviousOrderSpy = jest
  .spyOn(MasApiClient.prototype, 'getSentencePreviousOrder')
  .mockImplementation(() => Promise.resolve(mockPreviousOrder))
const getSentenceOffencesSpy = jest
  .spyOn(MasApiClient.prototype, 'getSentenceOffences')
  .mockImplementation(() => Promise.resolve(mockSentenceOffences))
const getSentenceLicenceConditionNoteSpy = jest
  .spyOn(MasApiClient.prototype, 'getSentenceLicenceConditionNote')
  .mockImplementation(() => Promise.resolve(mockLicenceConditionNote))
const getSentenceRequirementNoteSpy = jest
  .spyOn(MasApiClient.prototype, 'getSentenceRequirementNote')
  .mockImplementation(() => Promise.resolve(mockRequirementNote))
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
      eventNumber,
      licenceConditionId,
      requirementId,
      noteId,
    },
    query: {
      activeSentence: '',
      number: '1',
    },
  })

  describe('sentenceController', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })
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
    describe('getProbationHistory', () => {
      beforeEach(async () => {
        await controllers.sentence.getProbationHistory(hmppsAuthClient)(req, res)
      })
      checkAuditMessage(res, 'VIEW_MAS_SENTENCE', uuidv4(), crn, 'CRN')
      it('should request the page data from the api', () => {
        expect(getProbationHistorySpy).toHaveBeenCalledWith(crn)
        expect(getRisksSpy).toHaveBeenCalledWith(crn)
        expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
        expect(predictorsSpy).toHaveBeenCalledWith(crn)
      })
      it('should render the probation history page', () => {
        expect(renderSpy).toHaveBeenCalledWith('pages/probation-history', {
          sentenceDetails: mockProbationHistory,
          crn,
          tierCalculation: mockTierCalculation,
          risksWidget: toRoshWidget(mockRisks),
          predictorScores: toPredictors(mockPredictors),
        })
      })
    })
    describe('getPreviousOrders', () => {
      beforeEach(async () => {
        await controllers.sentence.getPreviousOrders(hmppsAuthClient)(req, res)
      })
      checkAuditMessage(res, 'VIEW_MAS_SENTENCE_PREVIOUS_ORDERS', uuidv4(), crn, 'CRN')
      it('should request the sentence previous orders from the api', () => {
        expect(getSentencePreviousOrdersSpy).toHaveBeenCalledWith(crn)
      })
      it('should render the previous orders page', () => {
        expect(renderSpy).toHaveBeenCalledWith('pages/sentence/previous-orders', {
          previousOrderHistory: mockPreviousOrders,
          crn,
        })
      })
    })
    describe('getPreviousOrderDetails', () => {
      beforeEach(async () => {
        await controllers.sentence.getPreviousOrderDetails(hmppsAuthClient)(req, res)
      })
      checkAuditMessage(res, 'VIEW_MAS_SENTENCE_PREVIOUS_ORDER', uuidv4(), crn, 'CRN')
      it('should request the sentence previous order from the api', () => {
        expect(getSentencePreviousOrderSpy).toHaveBeenCalledWith(crn, eventNumber)
      })
      it('should render the previous order page', () => {
        expect(renderSpy).toHaveBeenCalledWith('pages/sentence/previous-orders/previous-order', {
          previousOrderDetail: mockPreviousOrder,
          crn,
        })
      })
    })
    describe('getOffenceDetails', () => {
      beforeEach(async () => {
        await controllers.sentence.getOffenceDetails(hmppsAuthClient)(req, res)
      })
      checkAuditMessage(res, 'VIEW_MAS_SENTENCE_OFFENCE_DETAILS', uuidv4(), crn, 'CRN')
      it('should request the sentence offences from the api', () => {
        expect(getSentenceOffencesSpy).toHaveBeenCalledWith(crn, eventNumber)
      })
      it('should render the sentence offences page', () => {
        expect(renderSpy).toHaveBeenCalledWith('pages/sentence/offences', {
          offences: mockSentenceOffences,
          crn,
        })
      })
    })
    describe('getLicenceConditionNote', () => {
      beforeEach(async () => {
        await controllers.sentence.getLicenceConditionNote(hmppsAuthClient)(req, res)
      })
      checkAuditMessage(res, 'VIEW_MAS_SENTENCE_LICENCE_CONDITION_NOTE', uuidv4(), crn, 'CRN')
      it('should request the page data from the api', () => {
        expect(getSentenceLicenceConditionNoteSpy).toHaveBeenCalledWith(crn, licenceConditionId, noteId)
        expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
        expect(getRisksSpy).toHaveBeenCalledWith(crn)
        expect(predictorsSpy).toHaveBeenCalledWith(crn)
      })
      it('should render the licence condition note page', () => {
        expect(renderSpy).toHaveBeenCalledWith('pages/licence-condition-note', {
          licenceNoteDetails: mockLicenceConditionNote,
          tierCalculation: mockTierCalculation,
          crn,
          risksWidget: toRoshWidget(mockRisks),
          predictorScores: toPredictors(mockPredictors),
        })
      })
    })
    describe('getRequirementNote', () => {
      beforeEach(async () => {
        await controllers.sentence.getRequirementNote(hmppsAuthClient)(req, res)
      })
      checkAuditMessage(res, 'VIEW_MAS_SENTENCE_REQUIREMENT_NOTE', uuidv4(), crn, 'CRN')
      it('should request the page data from the api', () => {
        expect(getSentenceRequirementNoteSpy).toHaveBeenCalledWith(crn, requirementId, noteId)
        expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
        expect(getRisksSpy).toHaveBeenCalledWith(crn)
        expect(predictorsSpy).toHaveBeenCalledWith(crn)
      })
      it('should render the requirement note page', () => {
        expect(renderSpy).toHaveBeenCalledWith('pages/requirement-note', {
          requirementNoteDetails: mockRequirementNote,
          tierCalculation: mockTierCalculation,
          crn,
          risksWidget: toRoshWidget(mockRisks),
          predictorScores: toPredictors(mockPredictors),
        })
      })
    })
  })
})
