import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { type Services } from '../services'
import { filterActivityLog } from '../middleware'
import type { Route } from '../@types'
import controllers from '../controllers'
import validate from '../middleware/validation/index'

export default function activityLogRoutes(router: Router, { hmppsAuthClient }: Services) {
  router.all(
    '/case/:crn/activity-log',
    validate.activityLog,
    filterActivityLog,
    controllers.activityLog.getOrPostActivityLog(hmppsAuthClient),
  )
}
