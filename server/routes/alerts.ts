import { type Router } from 'express'
import { type Services, type Route } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import asyncMiddleware from '../middleware/asyncMiddleware'
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
}
