import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { DateTime } from 'luxon'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import { checkAuditMessage } from './testutils'
import { toPredictors, toRoshWidget } from '../utils'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import { mockAppResponse, mockTierCalculation, mockRisks, mockPredictors, mockDocuments } from './mocks'

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
const baseUrl = '/case/X000001/documents'

const res = mockAppResponse()
const renderSpy = jest.spyOn(res, 'render')
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)
const today = new Date()
const maxDate = DateTime.fromJSDate(today).toFormat('dd/MM/yyyy')
const searchDocumentsSpy = jest
  .spyOn(MasApiClient.prototype, 'searchDocuments')
  .mockImplementation(() => Promise.resolve(mockDocuments))
const textSearchDocumentsSpy = jest
  .spyOn(MasApiClient.prototype, 'textSearchDocuments')
  .mockImplementation(() => Promise.resolve(mockDocuments))

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
  session: {
    documentLevels: undefined,
  },
})

describe('documentsController with text search', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getDocuments with no filter', () => {
    beforeEach(async () => {
      await controllers.document.getDocuments(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_DOCUMENTS', uuidv4(), crn, 'CRN')
    it('should render the documents page with no filter', () => {
      const expectedFilter = {
        dateFrom: undefined as string,
        dateTo: undefined as string,
        fileName: undefined as string,
        maxDate: maxDate as string,
        selectedFilterItems: {
          dateRange: undefined as string,
          fileName: undefined as string,
        },
      }
      expect(renderSpy).toHaveBeenCalledWith('pages/documents', {
        documents: mockDocuments,
        pagination: mockPagination,
        tierCalculation: mockTierCalculation,
        crn,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
        baseUrl,
        filter: expectedFilter,
      })
    })
  })

  describe('getDocuments with empty filter (post)', () => {
    const postReq = httpMocks.createRequest({
      params: {
        crn,
      },
      method: 'POST',
      session: {
        documentFilter: undefined,
      },
    })
    beforeEach(async () => {
      await controllers.document.getDocuments(hmppsAuthClient)(postReq, res)
    })
    it('should request the page data from the api', () => {
      expect(textSearchDocumentsSpy).toHaveBeenCalledWith(
        crn,
        '0',
        { dateFrom: null, dateTo: null, levelCode: 'ALL', query: null },
        'createdAt.desc',
      )
      expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
      expect(risksSpy).toHaveBeenCalledWith(crn)
      expect(predictorsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the documents page with filter', () => {
      const expectedFilter = {
        dateFrom: undefined as string,
        dateTo: undefined as string,
        fileName: undefined as string,
        maxDate: maxDate as string,
        selectedFilterItems: {
          dateRange: undefined as string,
          fileName: undefined as string,
        },
      }
      expect(renderSpy).toHaveBeenCalledWith('pages/documents', {
        documents: mockDocuments,
        pagination: mockPagination,
        tierCalculation: mockTierCalculation,
        crn,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
        baseUrl,
        filter: expectedFilter,
      })
    })
  })

  describe('getDocuments with populated filter (post)', () => {
    const postReq = httpMocks.createRequest({
      params: {
        crn,
      },
      method: 'POST',
      session: {
        documentFilters: undefined,
        documentLevels: [{ code: 'PERSON', description: 'Person' }],
      },
      body: {
        dateFrom: '1/4/2025',
        dateTo: '2/4/2025',
        query: 'testing',
        documentLevel: 'PERSON',
      },
    })
    beforeEach(async () => {
      await controllers.document.getDocuments(hmppsAuthClient)(postReq, res)
    })
    it('should request the page data from the api', () => {
      expect(textSearchDocumentsSpy).toHaveBeenCalledWith(
        crn,
        '0',
        {
          dateFrom: '2025-04-01T00:00:00.000Z',
          dateTo: '2025-04-02T00:00:00.000Z',
          levelCode: 'PERSON',
          query: 'testing',
        },
        null,
      )
      expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
      expect(risksSpy).toHaveBeenCalledWith(crn)
      expect(predictorsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the documents page with filter', () => {
      const expectedFilter = {
        dateFrom: '1/4/2025' as string,
        dateTo: '2/4/2025' as string,
        query: 'testing' as string,
        fileName: undefined as string,
        documentLevel: 'PERSON' as string,
        maxDate: maxDate as string,
        selectedFilterItems: {
          dateRange: [
            {
              href: 'documents?clear=dates',
              text: '1/4/2025 to 2/4/2025',
            },
          ],
          documentLevel: [
            {
              href: 'documents?clear=documentLevel',
              text: 'Person',
            },
          ],
          query: [
            {
              href: 'documents?clear=query',
              text: 'testing',
            },
          ],
        },
      }
      expect(renderSpy).toHaveBeenCalledWith('pages/documents', {
        documents: mockDocuments,
        pagination: mockPagination,
        tierCalculation: mockTierCalculation,
        crn,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
        baseUrl,
        filter: expectedFilter,
      })
    })
  })

  describe('getDocuments with session and clear all filter', () => {
    const getRequest = httpMocks.createRequest({
      params: {
        crn,
      },
      session: {
        documentFilters: {
          dateFrom: '1/4/2025',
          dateTo: '2/4/2025',
          fileName: 'testing',
        },
      },
      query: {
        clear: 'all',
      },
      body: {
        dateFrom: '1/4/2025',
        dateTo: '2/4/2025',
        fileName: 'testing',
      },
    })
    beforeEach(async () => {
      await controllers.document.getDocuments(hmppsAuthClient)(getRequest, res)
    })
    it('should request the page data from the api', () => {
      expect(textSearchDocumentsSpy).toHaveBeenCalledWith(
        crn,
        '0',
        { dateFrom: null, dateTo: null, levelCode: 'ALL', query: null },
        'createdAt.desc',
      )
      expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
      expect(risksSpy).toHaveBeenCalledWith(crn)
      expect(predictorsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the documents page with clear all filter', () => {
      const expectedFilter = {
        dateFrom: undefined as string,
        dateTo: undefined as string,
        fileName: undefined as string,
        maxDate: maxDate as string,
        selectedFilterItems: {
          dateRange: undefined as any,
          fileName: undefined as any,
        },
      }
      expect(renderSpy).toHaveBeenCalledWith('pages/documents', {
        documents: mockDocuments,
        pagination: mockPagination,
        tierCalculation: mockTierCalculation,
        crn,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
        baseUrl,
        filter: expectedFilter,
      })
    })
  })

  describe('getDocuments with session and clear filename (search) filter', () => {
    const getRequest = httpMocks.createRequest({
      params: {
        crn,
      },
      session: {
        documentFilters: {
          dateFrom: '1/4/2025',
          dateTo: '2/4/2025',
          fileName: 'testing',
        },
      },
      query: {
        clear: 'search',
      },
      body: {
        dateFrom: '1/4/2025',
        dateTo: '2/4/2025',
        fileName: 'testing',
      },
    })
    beforeEach(async () => {
      await controllers.document.getDocuments(hmppsAuthClient)(getRequest, res)
    })
    it('should request the page data from the api', () => {
      expect(textSearchDocumentsSpy).toHaveBeenCalledWith(
        crn,
        '0',
        { dateFrom: '2025-04-01T00:00:00.000Z', dateTo: '2025-04-02T00:00:00.000Z', levelCode: 'ALL', query: null },
        'createdAt.desc',
      )
      expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
      expect(risksSpy).toHaveBeenCalledWith(crn)
      expect(predictorsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the documents page with filter', () => {
      const expectedFilter = {
        dateFrom: '1/4/2025' as string,
        dateTo: '2/4/2025' as string,
        fileName: undefined as string,
        maxDate: maxDate as string,
        selectedFilterItems: {
          dateRange: [
            {
              href: 'documents?clear=dates',
              text: '1/4/2025 to 2/4/2025',
            },
          ],
          fileName: undefined as any,
        },
      }
      expect(renderSpy).toHaveBeenCalledWith('pages/documents', {
        documents: mockDocuments,
        pagination: mockPagination,
        tierCalculation: mockTierCalculation,
        crn,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
        baseUrl,
        filter: expectedFilter,
      })
    })
  })

  describe('getDocuments with session and clear date range (search) filter', () => {
    const getRequest = httpMocks.createRequest({
      params: {
        crn,
      },
      session: {
        documentFilters: {
          dateFrom: '1/4/2025',
          dateTo: '2/4/2025',
          fileName: 'testing',
        },
      },
      query: {
        clear: 'dates',
      },
      body: {
        dateFrom: '1/4/2025',
        dateTo: '2/4/2025',
        fileName: 'testing',
      },
    })
    beforeEach(async () => {
      await controllers.document.getDocuments(hmppsAuthClient)(getRequest, res)
    })
    it('should request the page data from the api', () => {
      expect(textSearchDocumentsSpy).toHaveBeenCalledWith(
        crn,
        '0',
        { dateFrom: null, dateTo: null, levelCode: 'ALL', query: null },
        'createdAt.desc',
      )
      expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
      expect(risksSpy).toHaveBeenCalledWith(crn)
      expect(predictorsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the documents page with filter', () => {
      const expectedFilter = {
        dateFrom: undefined as string,
        dateTo: undefined as string,
        fileName: 'testing' as string,
        maxDate: maxDate as string,
        selectedFilterItems: {
          dateRange: undefined as any,
          fileName: [
            {
              href: 'documents?clear=search',
              text: 'testing',
            },
          ],
        },
      }
      expect(renderSpy).toHaveBeenCalledWith('pages/documents', {
        documents: mockDocuments,
        pagination: mockPagination,
        tierCalculation: mockTierCalculation,
        crn,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
        baseUrl,
        filter: expectedFilter,
      })
    })
  })

  describe('getDocuments with session and invalid date range (search) filter', () => {
    const getRequest = httpMocks.createRequest({
      params: {
        crn,
      },
      method: 'POST',
      session: {
        documentFilters: {
          dateFrom: '1/4/2025',
          dateTo: '2/4/2025',
          fileName: 'testing',
        },
      },
      body: {
        dateFrom: '2/4/2025',
        dateTo: '1/4/2025',
        fileName: 'testing',
      },
    })
    beforeEach(async () => {
      await controllers.document.getDocuments(hmppsAuthClient)(getRequest, res)
    })
    it('should request the page data from the api', () => {
      expect(textSearchDocumentsSpy).toHaveBeenCalledWith(
        crn,
        '0',
        { dateFrom: null, dateTo: null, levelCode: 'ALL', query: null },
        'createdAt.desc',
      )
      expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
      expect(risksSpy).toHaveBeenCalledWith(crn)
      expect(predictorsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the documents page with filter', () => {
      const expectedFilter = {
        dateFrom: '2/4/2025' as string,
        dateTo: '1/4/2025' as string,
        fileName: 'testing' as string,
        maxDate: maxDate as string,
        selectedFilterItems: {
          dateRange: undefined as any,
          fileName: [
            {
              href: 'documents?clear=search',
              text: 'testing',
            },
          ],
        },
      }
      expect(renderSpy).toHaveBeenCalledWith('pages/documents', {
        documents: mockDocuments,
        pagination: mockPagination,
        tierCalculation: mockTierCalculation,
        crn,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
        baseUrl,
        filter: expectedFilter,
      })
    })
  })

  describe('getDocuments with no filter and pagination data', () => {
    const getRequest = httpMocks.createRequest({
      params: {
        crn,
      },
      query: {
        page: 1,
        sortBy: 'createdAt.desc',
      },
      session: {
        documentFilters: undefined,
      },
      body: {
        dateFrom: '2/4/2025',
        dateTo: '1/4/2025',
        fileName: 'testing',
      },
    })
    beforeEach(async () => {
      await controllers.document.getDocuments(hmppsAuthClient)(getRequest, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_DOCUMENTS', uuidv4(), crn, 'CRN')
    it('should request the page data from the api', () => {
      expect(textSearchDocumentsSpy).toHaveBeenCalledWith(
        crn,
        '0',
        { dateFrom: null, dateTo: null, levelCode: 'ALL', query: null },
        'createdAt.desc',
      )
      expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
      expect(risksSpy).toHaveBeenCalledWith(crn)
      expect(predictorsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the documents page with pagination data', () => {
      const expectedFilter = {
        dateFrom: undefined as string,
        dateTo: undefined as string,
        fileName: undefined as string,
        maxDate: maxDate as string,
        selectedFilterItems: {
          dateRange: undefined as string,
          fileName: undefined as string,
        },
      }
      expect(renderSpy).toHaveBeenCalledWith('pages/documents', {
        documents: mockDocuments,
        pagination: mockPagination,
        tierCalculation: mockTierCalculation,
        crn,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
        baseUrl,
        filter: expectedFilter,
      })
    })
  })
})
