import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'
import { getPersonalDetails } from '../middleware'
import { getCheckinOffenderDetails } from '../middleware/getCheckinOffenderDetails'

export default function caseRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  router.all(
    ['/case/:crn', '/case/:crn/*path'],
    getPersonalDetails(hmppsAuthClient),
    getCheckinOffenderDetails(hmppsAuthClient),
  )
  get('/case/:crn', controllers.case.getCase(hmppsAuthClient))
}
