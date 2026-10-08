import { Router } from 'express'
import type { Services } from '../services'
import controllers from '../controllers'
import { setSearchFilters } from '../middleware/setSearchFilters'

export default function searchRoutes(router: Router, { hmppsAuthClient, searchService, typedSearchService }: Services) {
  router.post('/search', (req, res, next) => {
    if (res.locals?.flags?.enableAsYouTypeSearch) {
      return typedSearchService.post(req, res, next)
    }
    return searchService.post(req, res, next)
  })
  router.get(
    '/search',
    (req, res, next) => {
      if (res.locals?.flags?.enableAsYouTypeSearch) {
        return typedSearchService.get(req, res, next)
      }
      return searchService.get(req, res, next)
    },
    controllers.search.getSearch(),
  )

  router.post('/search/filters', setSearchFilters())

  router.get('/search/prisoner-image/:prisonerId', controllers.search.getPhoto(hmppsAuthClient))
}
