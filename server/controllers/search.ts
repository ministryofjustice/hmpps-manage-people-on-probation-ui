import { type Controller } from '@ministryofjustice/manage-people-on-probation-shared-lib'

const routes = ['getSearch'] as const

const searchController: Controller<typeof routes, void> = {
  getSearch: () => {
    return async (req, res) => {
      req.session.backLink = '/search'
      return res.render('pages/search')
    }
  },
}

export default searchController
