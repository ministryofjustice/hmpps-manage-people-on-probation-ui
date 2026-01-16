import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'
import {
  constructNextAppointmentSession,
  getAppointmentTypes,
  getSentences,
  getUserProviders,
  getNextComAppointment,
  getOverdueOutcomes,
} from '../middleware'
import validate from '../middleware/validation/index'
import { getPersonAppointment } from '../middleware/getPersonAppointment'
import { getCheckinOffenderDetails } from '../middleware/getCheckinOffenderDetails'

export default function scheduleRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/case/:crn/appointments', controllers.appointments.getAppointments(hmppsAuthClient))

  get('/case/:crn/upcoming-appointments', controllers.appointments.getAllUpcomingAppointments(hmppsAuthClient))

  post('/case/:crn/appointments', controllers.appointments.postAppointments(hmppsAuthClient))

  router.all('/case/:crn/record-an-outcome/outcome', [getOverdueOutcomes(hmppsAuthClient)])
  router.get('/case/:crn/record-an-outcome/outcome', controllers.appointments.getRecordAnOutcome(hmppsAuthClient))

  router.post(
    '/case/:crn/record-an-outcome/:actionType',
    validate.appointments,
    controllers.appointments.postRecordAnOutcome(hmppsAuthClient),
  )

  router.all('/case/:crn/appointments/appointment/:contactId/attended-complied', getPersonAppointment(hmppsAuthClient))

  get(
    '/case/:crn/appointments/appointment/:contactId/attended-complied',
    controllers.appointments.getAttendedComplied(hmppsAuthClient),
  )

  router.post(
    '/case/:crn/appointments/appointment/:contactId/attended-complied',
    validate.appointments,
    controllers.appointments.postAttendedComplied(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/appointments/appointment/:contactId/next-appointment',
    getNextComAppointment(hmppsAuthClient),
    controllers.appointments.getNextAppointment(hmppsAuthClient),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/next-appointment',
    getPersonAppointment(hmppsAuthClient),
    validate.appointments,
    getAppointmentTypes(hmppsAuthClient),
    getSentences(hmppsAuthClient),
    constructNextAppointmentSession,
    getUserProviders(hmppsAuthClient),
    controllers.appointments.postNextAppointment(hmppsAuthClient),
  )
  router.get(
    '/case/:crn/appointments/appointment/:contactId/manage',
    getNextComAppointment(hmppsAuthClient),
    controllers.appointments.getManageAppointment(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/appointments/appointment/:contactId/manage/note/:noteId',
    controllers.appointments.getAppointmentNote(hmppsAuthClient),
  )
}
