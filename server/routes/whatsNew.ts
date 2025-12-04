import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Route } from '../@types'
import type { Services } from '../services'
import controllers from '../controllers'

export default function whatsNewRoute(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get('/whats-new', controllers.whatsNew.getWhatsNew(hmppsAuthClient))
}
