import { type Router } from 'express'
import { type Services } from '../services'
import { filterActivityLog, getSentences } from '../middleware'
import controllers from '../controllers'
import validate from '../middleware/validation/index'

export default function activityLogRoutes(router: Router, { hmppsAuthClient }: Services) {
  router.get(
    '/case/:crn/activity-log',
    validate.activityLog,
    filterActivityLog,
    getSentences(hmppsAuthClient),
    controllers.activityLog.getOrPostActivityLog(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/activity/:id',
    getSentences(hmppsAuthClient),
    controllers.activityLog.getActivity(hmppsAuthClient),
  )
  router.get(`/case/:crn/activitylog/redirect`, controllers.activityLog.redirectToActivityLog(hmppsAuthClient))
}
