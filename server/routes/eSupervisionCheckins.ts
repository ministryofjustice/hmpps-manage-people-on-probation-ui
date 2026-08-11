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

  router.use(
    ['/case/:crn/appointments/check-in', '/case/:crn/appointments/:id/check-in'],
    redirectToManageCheckInService(),
  )
}
