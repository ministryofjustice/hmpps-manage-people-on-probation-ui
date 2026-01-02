import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'
import { getUserAlertsCount } from '../middleware/getUserAlertsCount'

export default function alertsRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string | string[], handler: Route<void>) => router.post(path, asyncMiddleware(handler))

  get('/alerts', controllers.alerts.getAlerts(hmppsAuthClient))
  router.post(
    '/alerts',
    controllers.alerts.clearSelectedAlerts(hmppsAuthClient),
    getUserAlertsCount(hmppsAuthClient),
    controllers.alerts.getAlerts(hmppsAuthClient),
  )

  get('/alerts/:contactId/note/:noteId', controllers.alerts.getAlertNote(hmppsAuthClient))
  router.post(
    '/alerts/:contactId/note/:noteId',
    controllers.alerts.clearSelectedAlerts(hmppsAuthClient),
    getUserAlertsCount(hmppsAuthClient),
    controllers.alerts.getAlertNote(hmppsAuthClient),
  )
}
