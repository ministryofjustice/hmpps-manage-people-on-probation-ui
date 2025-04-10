import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import { checkAuditMessage } from './testutils'
import { toPredictors, toRoshWidget } from '../utils'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import { mockAppResponse, mockTierCalculation, mockRisks, mockPredictors, mockDocumemts } from './mocks'
import { AppResponse } from '../@types'

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
const mockPagination = { from: '1', items: [], next: '2', prev: '1', to: '0', total: '0' } as Pagination
jest.mock('@ministryofjustice/probation-search-frontend/utils/pagination', () => ({
  __esModule: true,
  default: jest.fn(),
}))
;(getPaginationLinks as jest.Mock).mockReturnValue(mockPagination)

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const res = mockAppResponse()
const renderSpy = jest.spyOn(res, 'render')
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

const getDocumentsSpy = jest
  .spyOn(MasApiClient.prototype, 'getDocuments')
  .mockImplementation(() => Promise.resolve(mockDocumemts))
const tierCalculationSpy = jest
  .spyOn(TierApiClient.prototype, 'getCalculationDetails')
  .mockImplementation(() => Promise.resolve(mockTierCalculation))
const risksSpy = jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockImplementation(() => Promise.resolve(mockRisks))
const predictorsSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getPredictorsAll')
  .mockImplementation(() => Promise.resolve(mockPredictors))
const req = httpMocks.createRequest({
  params: {
    crn,
  },
})

describe('documentsController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('getDocuments', () => {
    beforeEach(async () => {
      await controllers.document.getDocuments(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_DOCUMENTS', uuidv4(), crn, 'CRN')
    it('should request the page data from the api', () => {
      expect(getDocumentsSpy).toHaveBeenCalledWith(crn, '0', 'createdAt.desc')
      expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
      expect(risksSpy).toHaveBeenCalledWith(crn)
      expect(predictorsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the documents page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/documents', {
        documents: mockDocumemts,
        pagination: mockPagination,
        tierCalculation: mockTierCalculation,
        crn,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
      })
    })
  })

  describe('getDocuments not enabled should return error', () => {
    beforeEach(async () => {
      res.locals.flags = {
        enableNavDocuments: false,
      }
      await controllers.document.getDocuments(hmppsAuthClient)(req, res)
    })
    it('should render the documents page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/error', {
        message: 'Page not found',
      })
    })
  })
})
