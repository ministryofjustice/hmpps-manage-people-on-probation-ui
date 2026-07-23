import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { addParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import MasApiClient from '../data/masApiClient'
import { Controller } from '../@types'

const routes = ['getAllEnforcementContacts'] as const
const colNames = ['surname', 'details', 'outcome', 'action']

const directions = {
  asc: 'ascending',
  desc: 'descending',
}

type ColName = (typeof colNames)[number]
type SortDir = 'asc' | 'desc'

const isValidColName = (value: string): value is ColName => colNames.includes(value as any)
const isValidDir = (value: string): value is SortDir => value === 'asc' || value === 'desc'

const enforcementContactsController: Controller<typeof routes, void> = {
  getAllEnforcementContacts: hmppsAuthClient => {
    return async function getAllEnforcementContacts(req, res) {
      const { user } = res.locals
      const { query, session, url } = req
      const { sortBy = '' } = query as Record<string, string>

      const pageNum: number = query.page ? Number.parseInt(query.page as string, 10) : 1

      // Validate sort parameters - only allow values in colNames and asc|desc
      let name: ColName | '' = ''
      let dir: SortDir | '' = ''

      if (sortBy) {
        const [rawName, rawDir] = sortBy.split('.')
        // Only allow column names from colNames and directions asc|desc
        if (isValidColName(rawName) && isValidDir(rawDir)) {
          name = rawName
          dir = rawDir
        }
      }

      const cols = colNames

      const sortByOrder = cols.reduce((acc, colName) => {
        const defaultSort = 'none'
        return { ...acc, [colName]: name === colName && dir ? directions[dir as SortDir] : defaultSort }
      }, {})

      const token = await hmppsAuthClient.getSystemClientToken(user.username)
      const masClient = new MasApiClient(token)
      const ascending = dir ? (dir === 'asc').toString() : ''

      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_ALL_ENFORCEMENT_ACTIONS',
        who: user.username,
        subjectId: user.username,
        subjectType: 'USER',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })

      const sortUrl = req.url.split('?')[0]
      const sortUrlEncoded = encodeURIComponent(req.url)

      const enforcementContacts = await masClient.getEnforcementContacts(
        user.username,
        (pageNum - 1).toString(),
        '25',
        name,
        ascending,
      )

      const pagination: Pagination = getPaginationLinks(
        query.page ? pageNum : 1,
        enforcementContacts.totalPages || 0,
        enforcementContacts.totalResults || 0,
        page => addParameters(req, { page: page.toString() }),
        enforcementContacts?.size || 10,
      )

      return res.render('pages/my-enforcement-actions', {
        enforcementContacts,
        sortByOrder,
        sortUrl,
        sortUrlEncoded,
        pagination,
        backLink: session.backLink,
      })
    }
  },
}

export default enforcementContactsController
