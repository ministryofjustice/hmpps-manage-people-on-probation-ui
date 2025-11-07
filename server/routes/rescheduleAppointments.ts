import { type RequestHandler, type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'
import {
  getAppointment,
  getAppointmentTypes,
  getOfficeLocationsByTeamAndProvider,
  getPersonalDetails,
  getPersonAppointment,
  getSentences,
  getWhoAttends,
} from '../middleware'

const rescheduleAppointmentRoutes = async (router: Router, { hmppsAuthClient }: Services) => {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

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
    getPersonalDetails(hmppsAuthClient),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getWhoAttends(hmppsAuthClient),
    getSentences(hmppsAuthClient),
    getAppointmentTypes(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    controllers.rescheduleAppointments.getRescheduleCheckYourAnswer(hmppsAuthClient),
  )
}

export default rescheduleAppointmentRoutes
