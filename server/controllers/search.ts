import { Controller } from '../@types'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'

const routes = ['getSearch'] as const

const searchController: Controller<typeof routes, void> = {
  getSearch: () => {
    return async (req, res) => {
      req.session.backLink = '/search'
      await sendAuditMessage(res, 'VIEW_MAS_SEARCH', res.locals.user.username, SubjectType.USER)
      return res.render('pages/search')
    }
  },
}

export default searchController
