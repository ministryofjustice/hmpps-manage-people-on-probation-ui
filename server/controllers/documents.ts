import { v4 } from 'uuid'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { addParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import { Controller } from '../@types/Controller.type'
import MasApiClient from '../data/masApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import TierApiClient from '../data/tierApiClient'
import { toRoshWidget, toPredictors } from '../utils'

const routes = ['getDocuments'] as const

const documentController: Controller<typeof routes> = {
  getDocuments: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
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

      const [documents, tierCalculation, risks, predictors] = await Promise.all([
        masClient.getDocuments(crn, (pageNum - 1).toString(), sortBy),
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
      })
    }
  },
}

export default documentController
