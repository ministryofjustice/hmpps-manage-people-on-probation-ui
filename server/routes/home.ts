import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Route } from '../@types'
import type { Services } from '../services'
import controllers from '../controllers'

export default function homeRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get('/', controllers.home.getHome(hmppsAuthClient))

  get('/sentry-test-error', (_req, _res) => {
    throw new Error('Sentry alert test (Express) - ignore')
  })
}
