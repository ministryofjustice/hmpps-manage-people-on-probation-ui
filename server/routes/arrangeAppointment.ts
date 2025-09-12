import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import {
  autoStoreSessionData,
  getPersonalDetails,
  getWhoAttends,
  getOfficeLocationsByTeamAndProvider,
  getSentences,
  getAppointmentTypes,
  getAppointment,
  redirectWizard,
} from '../middleware'
import type { Services } from '../services'
import validate from '../middleware/validation/index'
import { getTimeOptions } from '../middleware/getTimeOptions'
import type { Route } from '../@types'
import controllers from '../controllers'
import { checkAppointments } from '../middleware/checkAppointments'

const arrangeAppointmentRoutes = async (router: Router, { hmppsAuthClient }: Services) => {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  router.all('/case/:crn/arrange-appointment/:id/*path', getAppointmentTypes(hmppsAuthClient))
  router.all('/case/:crn/arrange-appointment/:id/*path', getPersonalDetails(hmppsAuthClient))
  router.get('/case/:crn/arrange-appointment/:id/*path', getAppointment(hmppsAuthClient))
  router.all('/case/:crn/arrange-appointment/:id/sentence', getSentences(hmppsAuthClient))
  get('/case/:crn/arrange-appointment/sentence', controllers.arrangeAppointments.redirectToSentence())
  get('/case/:crn/arrange-appointment/:id/sentence', controllers.arrangeAppointments.getSentence())

  router.post('/case/:crn/arrange-appointment/:id/*path', [
    autoStoreSessionData(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/arrange-appointment/:id/sentence',
    validate.appointments,
    controllers.arrangeAppointments.postSentence(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/type',
    redirectWizard(['eventId']),
    controllers.arrangeAppointments.getType(),
  )

  router.post(
    '/case/:crn/arrange-appointment/:id/type',
    validate.appointments,
    controllers.arrangeAppointments.postType(),
  )
  router.all('/case/:crn/arrange-appointment/:id/attendance', getWhoAttends(hmppsAuthClient))
  router.get(
    '/case/:crn/arrange-appointment/:id/attendance',
    redirectWizard(['eventId', 'type']),
    controllers.arrangeAppointments.getWhoWillAttend(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/attendance',
    validate.appointments,
    controllers.arrangeAppointments.postWhoWillAttend(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/location',
    redirectWizard(['eventId', 'type']),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    controllers.arrangeAppointments.getLocation(),
  )

  router.post(
    '/case/:crn/arrange-appointment/:id/location',
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    validate.appointments,
    controllers.arrangeAppointments.postLocation(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/location-not-in-list',
    redirectWizard(['eventId', 'type']),
    controllers.arrangeAppointments.getLocationNotInList(),
  )

  router.all('/case/:crn/arrange-appointment/:id/date-time', getTimeOptions)

  router.get(
    '/case/:crn/arrange-appointment/:id/date-time',
    redirectWizard(['eventId', ['user', 'locationCode']]),
    controllers.arrangeAppointments.getDateTime(),
  )

  router.post(
    '/case/:crn/arrange-appointment/:id/date-time',
    validate.appointments,
    checkAppointments(hmppsAuthClient),
    controllers.arrangeAppointments.postDateTime(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/repeating',
    redirectWizard(['eventId', 'type', ['user', 'locationCode']]),
    controllers.arrangeAppointments.getRepeating(),
  )

  router.post(
    '/case/:crn/arrange-appointment/:id/repeating',
    validate.appointments,
    controllers.arrangeAppointments.postRepeating(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/add-notes',
    redirectWizard(['eventId', 'type', ['user', 'locationCode'], 'repeating']),
    controllers.arrangeAppointments.getNotes(),
  )

  router.post(
    '/case/:crn/arrange-appointment/:id/add-notes',
    validate.appointments,
    controllers.arrangeAppointments.postNotes(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/check-your-answers',
    redirectWizard(['eventId', 'type', ['user', 'locationCode'], 'repeating']),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    controllers.arrangeAppointments.getCheckYourAnswers(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/check-your-answers',
    controllers.arrangeAppointments.postCheckYourAnswers(hmppsAuthClient),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/confirmation',
    redirectWizard(['eventId', 'type', ['user', 'locationCode'], 'repeating']),
    getPersonalDetails(hmppsAuthClient),
    controllers.arrangeAppointments.getConfirmation(),
  )
  router.post('/case/:crn/arrange-appointment/:id/confirmation', controllers.arrangeAppointments.postConfirmation())
  router.get(
    '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    controllers.arrangeAppointments.getArrangeAnotherAppointment(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
    controllers.arrangeAppointments.postArrangeAnotherAppointment(hmppsAuthClient),
  )
}

export default arrangeAppointmentRoutes
