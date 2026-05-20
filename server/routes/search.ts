import { Router } from 'express'
import type { Services } from '../services'
import controllers from '../controllers'

export default function searchRoutes(router: Router, { searchService }: Services) {
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
}
