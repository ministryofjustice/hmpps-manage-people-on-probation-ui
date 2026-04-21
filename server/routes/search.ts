import { Router } from 'express'
import type { Services } from '../services'
import controllers from '../controllers'

export default function searchRoutes(router: Router, { searchService, searchServiceWithoutExtraColumns }: Services) {
  router.post('/search', (req, res, next) => {
    if (res.locals.flags.enablePoPSearchExtraColumns) {
      return searchService.post(req, res, next)
    }
    return searchServiceWithoutExtraColumns.post(req, res, next)
  })
  router.get(
    '/search',
    (req, res, next) => {
      if (res.locals.flags.enablePoPSearchExtraColumns) {
        return searchService.get(req, res, next)
      }
      return searchServiceWithoutExtraColumns.get(req, res, next)
    },
    controllers.search.getSearch(),
  )
}
