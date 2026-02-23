import { type Services, type Route } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import controllers from '../controllers'

export default function interventionsRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get('/case/:crn/interventions', controllers.interventions.getInterventions(hmppsAuthClient))
}
