import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'
import { getPersonalDetails, autoStoreSessionData, getAppointment } from '../middleware'

export default function scheduleRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/case/:crn/appointments', controllers.appointments.getAppointments(hmppsAuthClient))

  get('/case/:crn/upcoming-appointments', controllers.appointments.getAllUpcomingAppointments(hmppsAuthClient))

  post('/case/:crn/appointments', controllers.appointments.postAppointments(hmppsAuthClient))

  router.get(
    '/case/:crn/appointments/appointment/:contactId',
    getPersonalDetails(hmppsAuthClient),
    controllers.appointments.getAppointmentDetails(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/record-an-outcome/:actionType',
    getPersonalDetails(hmppsAuthClient),
    controllers.appointments.getRecordAnOutcome(hmppsAuthClient),
  )

  router.post(
    '/case/:crn/record-an-outcome/:actionType',
    getPersonalDetails(hmppsAuthClient),
    controllers.appointments.postRecordAnOutcome(hmppsAuthClient),
  )

  router.post('/case/:crn/appointments/appointment/:contactId/next-appointment', [
    autoStoreSessionData(hmppsAuthClient),
  ])
  router.get(
    '/case/:crn/appointments/appointment/:contactId/next-appointment',
    getPersonalDetails(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    controllers.appointments.getNextAppointment(hmppsAuthClient),
  )
}
