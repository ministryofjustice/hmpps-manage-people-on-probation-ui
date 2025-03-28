import { Controller } from '../@types'

const routes = ['getSearch'] as const

const searchController: Controller<typeof routes> = {
  getSearch: () => {
    return async (req, res) => {
      req.session.backLink = '/search'
      return res.render('pages/search')
    }
  },
}

export default searchController
