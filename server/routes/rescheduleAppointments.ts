import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import parallelMiddleware from '../middleware/parallelMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'
import {
  autoStoreSessionData,
  cacheUploadedFiles,
  createAppointmentSession,
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

const rescheduleAppointmentRoutes = (router: Router, { hmppsAuthClient, arnsComponents }: Services) => {
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

  router.post(
    '/case/:crn/appointments/reschedule/:contactId/:id',
    getPersonAppointment(hmppsAuthClient),
    cacheUploadedFiles,
    validate.appointments,
    autoStoreSessionData(hmppsAuthClient),
    parallelMiddleware(getAppointmentTypes(hmppsAuthClient), getSentences(hmppsAuthClient)),
    createAppointmentSession,
    getUserProviders(hmppsAuthClient),
    controllers.rescheduleAppointments.postRescheduleAppointment(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/appointments/reschedule/:contactId/:id/confirmation',
    parallelMiddleware(
      getOverdueOutcomes(hmppsAuthClient),
      getAppointmentTypes(hmppsAuthClient),
      getPersonalDetails(hmppsAuthClient, arnsComponents),
      // getUserProviders reads res.locals.personAppointment
      [getPersonAppointment(hmppsAuthClient), getUserProviders(hmppsAuthClient)],
      getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    ),
    // getAppointment reads the case, appointment types, providers and locations set above
    getAppointment(hmppsAuthClient),
    controllers.arrangeAppointments.getConfirmation(hmppsAuthClient),
  )
  router.post(
    '/case/:crn/appointments/reschedule/:contactId/:id/confirmation',
    controllers.arrangeAppointments.postConfirmation(),
  )
}

export default rescheduleAppointmentRoutes
