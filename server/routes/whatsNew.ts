import { type Router } from 'express'
import { type Services, type Route } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import asyncMiddleware from '../middleware/asyncMiddleware'
import controllers from '../controllers'

export default function whatsNewRoute(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get('/whats-new', controllers.whatsNew.getWhatsNew(hmppsAuthClient))
}
