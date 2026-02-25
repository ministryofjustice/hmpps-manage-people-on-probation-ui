import { type Services } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import { Router } from 'express'
import controllers from '../controllers'

export default function searchRoutes(router: Router, { searchService }: Services) {
  router.post('/search', searchService.post)
  router.get('/search', searchService.get, controllers.search.getSearch())
}
