import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'

const rescheduleAppointmentRoutes = async (router: Router, { hmppsAuthClient }: Services) => {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get(
    '/case/:crn/appointment/:contactId/reschedule-appointment',
    controllers.rescheduleAppointments.redirectToRescheduleAppointment(),
  )

  router.get(
    '/case/:crn/reschedule-appointment/:id/reschedule/:contactId',
    controllers.rescheduleAppointments.getRescheduleAppointment(hmppsAuthClient),
  )
}

export default rescheduleAppointmentRoutes
