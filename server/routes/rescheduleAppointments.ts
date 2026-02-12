import { type RequestHandler, type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'
import {
  autoStoreSessionData,
  cacheUploadedFiles,
  constructNextAppointmentSession,
  getAppointment,
  getAppointmentTypes,
  getOfficeLocationsByTeamAndProvider,
  getOverdueOutcomes,
  getPersonalDetails,
  getPersonAppointment,
  getSentences,
  getUserProviders,
} from '../middleware'
import validate from '../middleware/validation'

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
    '/case/:crn/appointments/reschedule/:contactId/:id/check-your-answers',
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    controllers.rescheduleAppointments.getRescheduleCheckYourAnswer(hmppsAuthClient),
  )

  router.post(
    '/case/:crn/appointments/reschedule/:contactId/:id',
    getPersonAppointment(hmppsAuthClient),
    autoStoreSessionData(hmppsAuthClient),
    cacheUploadedFiles,
    validate.appointments,
    getAppointmentTypes(hmppsAuthClient),
    getSentences(hmppsAuthClient),
    constructNextAppointmentSession,
    getUserProviders(hmppsAuthClient),
    controllers.rescheduleAppointments.postRescheduleAppointment(hmppsAuthClient),
  )

  router.post(
    '/case/:crn/appointments/reschedule/:contactId/:id/check-your-answers',
    getPersonAppointment(hmppsAuthClient),
    controllers.arrangeAppointments.postCheckYourAnswers(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/appointments/reschedule/:contactId/:id/confirmation',
    getOverdueOutcomes(hmppsAuthClient),
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient),
    getPersonAppointment(hmppsAuthClient),
    getUserProviders(hmppsAuthClient),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    controllers.arrangeAppointments.getConfirmation(hmppsAuthClient),
  )
  router.post(
    '/case/:crn/appointments/reschedule/:contactId/:id/confirmation',
    controllers.arrangeAppointments.postConfirmation(),
  )
}

export default rescheduleAppointmentRoutes
