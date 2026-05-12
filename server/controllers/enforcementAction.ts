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
      const sortedBy = req.query.sortBy ? (req.query.sortBy as string) : 'date.asc'
      const [sortName, sortDirection] = sortedBy.split('.')
      const isAscending: boolean = sortDirection === 'asc'
      const pageNum: number = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1
      const sortQuery =
        sortName === 'time' ? `&sortBy=date&ascending=${isAscending}` : `&sortBy=${sortName}&ascending=${isAscending}`
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

      // TODO: This should call getEnforcementContacts when the API is ready
      const enforcementActions = await masClient.getPersonSchedule(crn, 'upcoming', (pageNum - 1).toString(), sortQuery)

      const pagination: Pagination = getPaginationLinks(
        req.query.page ? pageNum : 1,
        enforcementActions.personSchedule?.totalPages || 0,
        enforcementActions.personSchedule?.totalResults || 0,
        page => addParameters(req, { page: page.toString() }),
        enforcementActions.personSchedule?.size || 10,
      )

      return res.render('pages/my-enforcement-actions', {
        enforcementActions,
        crn,
        sortedBy,
        url,
        pagination,
      })
    }
  },
}

export default enforcementContactsController
