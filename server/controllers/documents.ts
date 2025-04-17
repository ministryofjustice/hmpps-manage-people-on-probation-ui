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
import { SearchDocumentsRequest } from '../data/model/documents'

const routes = ['getDocuments'] as const

const documentController: Controller<typeof routes> = {
  getDocuments: hmppsAuthClient => {
    return async (req, res) => {
      if (res.locals.flags?.enableNavDocuments === false) {
        res.status(404)
        return res.render('pages/error', { message: 'Page not found' })
      }
      const errors = validateWithSpec(req.body, documentSearchValidation())
      res.locals.errorMessages = errors
      if (
        req?.session?.documentFilters &&
        (req?.query?.clear === 'all' || (Object.keys(req.query).length === 0 && req.method === 'GET'))
      ) {
        req.session.documentFilters = undefined
      }

      if (req.method === 'POST') {
        req.session.documentFilters = req.body
      }

      if (req.query.clear === 'dates' && req.session.documentFilters) {
        req.session.documentFilters.dateFrom = undefined
        req.session.documentFilters.dateTo = undefined
      }

      if (req.query.clear === 'search' && req.session.documentFilters) {
        req.session.documentFilters.fileName = undefined
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
        dateFrom: req?.session?.documentFilters?.dateFrom,
        dateTo: req?.session?.documentFilters?.dateTo,
        maxDate: DateTime.fromJSDate(today).toFormat('dd/MM/yyyy'),
        selectedFilterItems: {
          fileName: keyWordFilter(),
          dateRange: dateRangeFilter(),
        },
      }

      const { crn } = req.params
      const baseUrl = `/case/${crn}/documents`
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const sortBy = req.query.sortBy ? (req.query.sortBy as string) : 'createdAt.desc'
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
      const request: SearchDocumentsRequest = {
        name: req.session?.documentFilters?.fileName || null,
        dateFrom: !errors.dateFrom ? toIsoDateTimeFromPicker(req.session?.documentFilters?.dateFrom) : null,
        dateTo: !errors.dateTo ? toIsoDateTimeFromPicker(req.session?.documentFilters?.dateTo) : null,
      }
      const [documents, tierCalculation, risks, predictors] = await Promise.all([
        masClient.searchDocuments(crn, (pageNum - 1).toString(), sortBy, request),
        tierClient.getCalculationDetails(crn),
        arnsClient.getRisks(crn),
        arnsClient.getPredictorsAll(crn),
      ])
      const predictorScores = toPredictors(predictors)
      const risksWidget = toRoshWidget(risks)
      const pagination: Pagination = getPaginationLinks(
        req.query.page ? pageNum : 1,
        documents?.totalPages || 0,
        documents?.totalElements || 0,
        page => addParameters(req, { page: page.toString() }),
        documents?.pageSize || 15,
      )
      return res.render('pages/documents', {
        documents,
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
