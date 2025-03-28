import { Router } from 'express'
import type { Services } from '../services'
import controllers from '../controllers'

export default function searchRoutes(router: Router, { searchService }: Services) {
  router.post('/search', searchService.post)
  router.get('/search', searchService.get, controllers.search.getSearch())
}
