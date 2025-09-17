import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'
import {
  getPersonalDetails,
  constructNextAppointmentSession,
  getAppointmentTypes,
  getSentences,
  getUserProviders,
  getNextComAppointment,
} from '../middleware'
import validate from '../middleware/validation/index'
import { getPersonAppointment } from '../middleware/getPersonAppointment'

export default function scheduleRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/case/:crn/appointments', controllers.appointments.getAppointments(hmppsAuthClient))

  get('/case/:crn/upcoming-appointments', controllers.appointments.getAllUpcomingAppointments(hmppsAuthClient))

  post('/case/:crn/appointments', controllers.appointments.postAppointments(hmppsAuthClient))

  router.get(
    '/case/:crn/appointments/appointment/:contactId',
    getPersonalDetails(hmppsAuthClient),
    getNextComAppointment(hmppsAuthClient),
    controllers.appointments.getManageAppointment(hmppsAuthClient),
  )

  router.all(
    '/case/:crn/appointments/appointment/:contactId/record-an-outcome',
    getPersonalDetails(hmppsAuthClient),
    getPersonAppointment(hmppsAuthClient),
  )
  get(
    '/case/:crn/appointments/appointment/:contactId/record-an-outcome',
    controllers.appointments.getRecordAnOutcome(hmppsAuthClient),
  )

  router.post(
    '/case/:crn/appointments/appointment/:contactId/record-an-outcome',
    validate.appointments,
    controllers.appointments.postRecordAnOutcome(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/appointments/appointment/:contactId/next-appointment',
    getPersonalDetails(hmppsAuthClient),
    getNextComAppointment(hmppsAuthClient),
    controllers.appointments.getNextAppointment(hmppsAuthClient),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/next-appointment',
    getPersonalDetails(hmppsAuthClient),
    getPersonAppointment(hmppsAuthClient),
    validate.appointments,
    getAppointmentTypes(hmppsAuthClient),
    getSentences(hmppsAuthClient),
    constructNextAppointmentSession,
    getUserProviders(hmppsAuthClient),
    controllers.appointments.postNextAppointment(hmppsAuthClient),
  )
  // router.get(
  //   '/case/:crn/appointments/appointment/:contactId/manage',
  //   getPersonalDetails(hmppsAuthClient),
  //   getNextComAppointment(hmppsAuthClient),
  //   controllers.appointments.getManageAppointment(hmppsAuthClient),
  // )
}
