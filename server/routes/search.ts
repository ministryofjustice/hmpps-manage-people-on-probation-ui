import { Router } from 'express'
import type { Services } from '../services'
import controllers from '../controllers'
import { setSearchFilters } from '../middleware/setSearchFilters'

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

  router.post('/search/filters', setSearchFilters)

  router.get('/search/prisoner-image/:prisonerId', controllers.search.getPhoto(hmppsAuthClient))
}
