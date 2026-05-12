import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { addParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import MasApiClient from '../data/masApiClient'
import { Controller } from '../@types'

const routes = ['getAllEnforcementContacts'] as const

const enforcementContactsController: Controller<typeof routes, void> = {
  getAllEnforcementContacts: hmppsAuthClient => {
    return async (req, res) => {
      const url = encodeURIComponent(req.url)
      const pageNum: number = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1
      const { crn } = req.params as Record<string, string>
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)

      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_ALL_ENFORCEMENT_ACTIONS',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })

      const enforcementActions = await masClient.getEnforcementContacts(
        res.locals.user.username,
        (pageNum - 1).toString(),
      )

      return res.render('pages/my-enforcement-actions', {
        enforcementActions,
        url,
      })
    }
  },
}

export default enforcementContactsController
