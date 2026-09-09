import { type Router } from 'express'
import type { Services } from '../services'
import { renderError } from '../middleware'
import { AppResponse } from '../models/Locals'
import { redirectToManageCheckInService } from '../middleware/redirectToManageCheckInService'

export default function eSuperVisionCheckInsRoutes(router: Router, { hmppsAuthClient }: Services) {
  router.use(
    ['/case/:crn/appointments/check-in', '/case/:crn/appointments/:id/check-in'],
    (req, res: AppResponse, next) => {
      if (res.locals.flags?.enableESupervisionCheckins !== true) {
        return renderError(403)(req, res)
      }
      return next()
    },
  )

  // Redirect all check-in routes to the manage online check-ins service
  router.use(
    [
      '/case/:crn/appointments/check-in/eligibility-check',
      '/case/:crn/appointments/:id/check-in/eligibility-check',
      '/case/:crn/appointments/:id/check-in/denied-eligibility',
      '/case/:crn/appointments/:id/check-in/full-eligibility',
      '/case/:crn/appointments/:id/check-in/supplementary-eligibility',
      '/case/:crn/appointments/:id/check-in/spo-approval',
      '/case/:crn/appointments/:id/check-in/rationale',
      '/case/:crn/appointments/:id/check-in/date-frequency',
      '/case/:crn/appointments/:id/check-in/contact-preference',
      '/case/:crn/appointments/:id/check-in/edit-contact-preference',
      '/case/:crn/appointments/:id/check-in/photo-options',
      '/case/:crn/appointments/:id/check-in/take-a-photo',
      '/case/:crn/appointments/:id/check-in/upload-a-photo',
      '/case/:crn/appointments/:id/check-in/photo-rules',
      '/case/:crn/appointments/:id/check-in/checkin-summary',
      '/case/:crn/appointments/:id/check-in/confirm-start',
      '/case/:crn/appointments/:id/check-in/confirm-end',
      '/case/:crn/appointments/check-in/manage/:id',
      '/case/:crn/appointments/check-in/manage/:id/settings',
      '/case/:crn/appointments/check-in/manage/:id/contact',
      '/case/:crn/appointments/check-in/manage/:id/edit-contact',
      '/case/:crn/appointments/check-in/manage/:id/stop-checkin',
      '/case/:crn/appointments/check-in/manage/:id/restart-checkin',
      '/case/:crn/appointments/check-in/manage/:id/restart-contact',
      '/case/:crn/appointments/check-in/manage/:id/restart-edit-contact',
      '/case/:crn/appointments/check-in/manage/:id/restart-summary',
      '/case/:crn/appointments/check-in/manage/:id/restart-confirmation',
      '/case/:crn/appointments/:id/check-in/update',
      '/case/:crn/appointments/:id/check-in/view',
      '/case/:crn/appointments/:id/check-in/view-expired',
      '/case/:crn/appointments/:id/check-in/review',
      '/case/:crn/appointments/check-in/manage/:id/questions/start',
      '/case/:crn/appointments/check-in/manage/:id/questions/add',
      '/case/:crn/appointments/check-in/manage/:id/questions/list',
      '/case/:crn/appointments/check-in/manage/:id/questions/:questionId/edit',
      '/case/:crn/appointments/check-in/manage/:id/questions/:templateId/select',
      '/case/:crn/appointments/check-in/manage/:id/questions/:questionId/delete',
      '/case/:crn/appointments/check-in/manage/:id/questions/preview/feeling',
      '/case/:crn/appointments/check-in/manage/:id/questions/preview/support',
    ],
    redirectToManageCheckInService,
  )
}
