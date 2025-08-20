import { v4 } from 'uuid'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { addParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import { DateTime } from 'luxon'
import { Controller } from '../@types'
import MasApiClient from '../data/masApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import TierApiClient from '../data/tierApiClient'
import { toIsoDateTimeFromPicker, toPredictors, toRoshWidget } from '../utils'
import { validateWithSpec } from '../utils/validationUtils'
import { documentSearchValidation } from '../properties'
import { SearchDocumentsRequest, TextSearchDocumentsRequest } from '../data/model/documents'
import { highlightText } from '../utils/highlightText'

const routes = ['getDocuments'] as const

const documentController: Controller<typeof routes, void> = {
  getDocuments: hmppsAuthClient => {
    return async (req, res) => {
      const errors = validateWithSpec(req?.body ?? {}, documentSearchValidation())
      res.locals.errorMessages = errors

      function clearFilter(type: string, fields: string[]) {
        if (req.query.clear === type && req.session.documentFilters) {
          fields.forEach(f => {
            req.session.documentFilters[f] = undefined
          })
        }
      }
      clearFilter('dates', ['dateFrom', 'dateTo'])
      clearFilter('search', ['fileName'])
      clearFilter('query', ['query'])
      clearFilter('documentLevel', ['documentLevel'])

      if (
        req?.session?.documentFilters &&
        (req?.query?.clear === 'all' || (Object.keys(req.query).length === 0 && req.method === 'GET'))
      ) {
        req.session.documentFilters = undefined
      }

      if (req.method === 'POST') {
        req.session.documentFilters = req?.body ?? {}
      }

      const dateRangeFilter = () => {
        if (
          req?.session?.documentFilters?.dateFrom &&
          req?.session?.documentFilters?.dateTo &&
          !errors.dateFrom &&
          !errors.dateTo
        ) {
          return [
            {
              text: `${req.session.documentFilters.dateFrom} to ${req.session.documentFilters.dateTo}`,
              href: 'documents?clear=dates',
            },
          ]
        }
        return undefined
      }

      const queryFilter = () => {
        if (req?.session?.documentFilters?.query) {
          return [
            {
              text: req.session.documentFilters?.query,
              href: 'documents?clear=query',
            },
          ]
        }
        return undefined
      }

      const docFilterDescription = (code: string) => {
        return req?.session?.documentLevels?.find(l => l.code === code)?.description
      }

      const documentLevelFilter = () => {
        if (req?.session?.documentFilters?.documentLevel && req.session.documentFilters.documentLevel !== 'ALL') {
          return [
            {
              text: docFilterDescription(req.session.documentFilters?.documentLevel),
              href: 'documents?clear=documentLevel',
            },
          ]
        }
        return undefined
      }

      const keyWordFilter = () => {
        if (req?.session?.documentFilters?.fileName) {
          return [
            {
              text: req.session.documentFilters?.fileName,
              href: 'documents?clear=search',
            },
          ]
        }
        return undefined
      }

      const today = new Date()
      const filter = {
        fileName: req?.session?.documentFilters?.fileName,
        query: req?.session?.documentFilters?.query,
        documentLevel: req?.session?.documentFilters?.documentLevel,
        dateFrom: req?.session?.documentFilters?.dateFrom,
        dateTo: req?.session?.documentFilters?.dateTo,
        maxDate: DateTime.fromJSDate(today).toFormat('dd/MM/yyyy'),
        selectedFilterItems: {
          fileName: keyWordFilter(),
          query: queryFilter(),
          documentLevel: documentLevelFilter(),
          dateRange: dateRangeFilter(),
        },
      }

      const { crn } = req.params
      const baseUrl = `/case/${crn}/documents`
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      let sortBy = req.query.sortBy ? (req.query.sortBy as string) : 'createdAt.desc'
      const pageNum: number = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_DOCUMENTS',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const arnsClient = new ArnsApiClient(token)
      const masClient = new MasApiClient(token)
      const tierClient = new TierApiClient(token)

      const textSearchRequest: TextSearchDocumentsRequest = {
        query: req.session?.documentFilters?.query ?? null,
        levelCode: req.session?.documentFilters?.documentLevel ?? 'ALL',
        dateFrom: !errors.dateFrom ? toIsoDateTimeFromPicker(req.session?.documentFilters?.dateFrom) : null,
        dateTo: !errors.dateTo ? toIsoDateTimeFromPicker(req.session?.documentFilters?.dateTo) : null,
      }
      sortBy = textSearchRequest.query && !req.query.sortBy ? null : sortBy

      const filenameRequest: SearchDocumentsRequest = {
        name: req.session?.documentFilters?.fileName ?? null,
        dateFrom: !errors.dateFrom ? toIsoDateTimeFromPicker(req.session?.documentFilters?.dateFrom) : null,
        dateTo: !errors.dateTo ? toIsoDateTimeFromPicker(req.session?.documentFilters?.dateTo) : null,
      }

      const textSearchEnabled = res.locals.flags.enableDocumentTextSearch === true

      const [documents, tierCalculation, risks, predictors] = await Promise.all([
        textSearchEnabled
          ? masClient.textSearchDocuments(crn, (pageNum - 1).toString(), textSearchRequest, sortBy)
          : masClient.searchDocuments(crn, (pageNum - 1).toString(), sortBy, filenameRequest),
        tierClient.getCalculationDetails(crn),
        arnsClient.getRisks(crn),
        arnsClient.getPredictorsAll(crn),
      ])

      const docsHighlightedFilename = {
        ...documents,
        documents: highlightText(textSearchRequest.query, documents.documents),
      }
      const predictorScores = toPredictors(predictors)
      const risksWidget = toRoshWidget(risks)
      const pagination: Pagination = getPaginationLinks(
        req.query.page ? pageNum : 1,
        documents?.totalPages || 0,
        documents?.totalElements || 0,
        page => addParameters(req, { page: page.toString() }),
        documents?.pageSize || 15,
      )

      if (textSearchEnabled) {
        req.session.documentLevels = documents.metadata.documentLevels
      }

      return res.render('pages/documents', {
        documents: docsHighlightedFilename,
        pagination,
        crn,
        tierCalculation,
        risksWidget,
        predictorScores,
        baseUrl,
        filter,
      })
    }
  },
}

export default documentController
