import { Router } from 'express'
import type { Services } from '../services'
import controllers from '../controllers'

export default function searchRoutes(router: Router, { hmppsAuthClient, searchService }: Services) {
  router.post('/search', (req, res, next) => {
    return searchService.post(req, res, next)
  })
  router.get(
    '/search',
    (req, res, next) => {
      return searchService.get(req, res, next)
    },
    controllers.search.getSearch(),
  )

  router.post('/search/filters', (req, res) => {
    if (!req.session.probationSearch) req.session.probationSearch = {}
    const session = req.session.probationSearch
    session.matchAllTerms = req.body.matchAllTerms
    session.providers = req.body.providers
    res.sendStatus(200)
  })

  router.get('/search/prisoner-image/:prisonerId', controllers.search.getPhoto(hmppsAuthClient))
}
