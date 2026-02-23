import { type Router } from 'express'
import { type Services } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import { filterActivityLog } from '../middleware'
import controllers from '../controllers'
import validate from '../middleware/validation/index'

export default function activityLogRoutes(router: Router, { hmppsAuthClient }: Services) {
  router.all(
    '/case/:crn/activity-log',
    validate.activityLog,
    filterActivityLog,
    controllers.activityLog.getOrPostActivityLog(hmppsAuthClient),
  )

  router.get('/case/:crn/activity/:id', controllers.activityLog.getActivity(hmppsAuthClient))
}
