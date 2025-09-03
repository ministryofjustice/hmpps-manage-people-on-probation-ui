import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'
import { getPersonalDetails } from '../middleware'

export default function risksRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get('/case/:crn/risk', controllers.risk.getRisk(hmppsAuthClient))

  router.get('/case/:crn/risk/flag/:id', [
    getPersonalDetails(hmppsAuthClient),
    controllers.risk.getRiskFlag(hmppsAuthClient),
  ])

  get('/case/:crn/risk/flag/:id/note/:noteId', controllers.risk.getRiskFlagSingleNote(hmppsAuthClient))

  get(
    '/case/:crn/risk/flag/:id/risk-removal-note/:noteId',
    controllers.risk.getRiskRemovalFlagSingleNote(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/risk/removed-risk-flags',
    getPersonalDetails(hmppsAuthClient),
    controllers.risk.getRemovedRiskFlags(hmppsAuthClient),
  )
}
