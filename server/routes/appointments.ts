import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'

export default function scheduleRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/case/:crn/appointments', controllers.appointments.getAppointments(hmppsAuthClient))

  post('/case/:crn/appointments', controllers.appointments.postAppointments(hmppsAuthClient))

  get('/case/:crn/appointments/appointment/:contactId', controllers.appointments.getAppointmentDetails(hmppsAuthClient))

  get('/case/:crn/record-an-outcome/:actionType', controllers.appointments.getRecordAnOutcome(hmppsAuthClient))

  post('/case/:crn/record-an-outcome/:actionType', controllers.appointments.postRecordAnOutcome(hmppsAuthClient))
}
