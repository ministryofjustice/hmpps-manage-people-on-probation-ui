import { type Router } from 'express'
import { type Services, type Route } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import asyncMiddleware from '../middleware/asyncMiddleware'
import controllers from '../controllers'

export default function homeRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get('/', controllers.home.getHome(hmppsAuthClient))

  get('/sentry-test-error', (_req, _res) => {
    throw new Error('Sentry alert test (Express) - ignore')
  })
}
