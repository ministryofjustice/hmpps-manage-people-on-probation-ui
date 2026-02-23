import { type Router } from 'express'
import { type Services, type Route } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import asyncMiddleware from '../middleware/asyncMiddleware'
import controllers from '../controllers'
import { getPersonalDetails, getPersonRiskFlags } from '../middleware'

export default function caseRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  router.all(
    ['/case/:crn', '/case/:crn/*path'],
    getPersonalDetails(hmppsAuthClient),
    getPersonRiskFlags(hmppsAuthClient),
  )
  get('/case/:crn', controllers.case.getCase(hmppsAuthClient))
}
