import { type RequestHandler, type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'
import { getAppointment, getOfficeLocationsByTeamAndProvider, getPersonAppointment } from '../middleware'

const rescheduleAppointmentRoutes = async (router: Router, { hmppsAuthClient }: Services) => {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get(
    '/case/:crn/appointment/:contactId/reschedule',
    controllers.rescheduleAppointments.redirectToRescheduleAppointment(),
  )

  router.get(
    '/case/:crn/appointments/reschedule/:contactId/:id',
    getPersonAppointment(hmppsAuthClient),
    controllers.rescheduleAppointments.getRescheduleAppointment(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/appointments/reschedule/:contactId/:id/check-answers',
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    controllers.rescheduleAppointments.getRescheduleCheckYourAnswer(hmppsAuthClient),
  )
}

export default rescheduleAppointmentRoutes
