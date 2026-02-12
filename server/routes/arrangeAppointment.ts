import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import {
  autoStoreSessionData,
  getPersonalDetails,
  getOfficeLocationsByTeamAndProvider,
  getSentences,
  getAppointmentTypes,
  getAppointment,
  redirectWizard,
  getDefaultUser,
  getUserOptions,
  routeChangeAttendee,
  getSmsPreview,
  getPersonRiskFlags,
  getOverdueOutcomes,
} from '../middleware'
import type { Services } from '../services'
import validate from '../middleware/validation/index'
import { getTimeOptions } from '../middleware/getTimeOptions'
import type { Route } from '../@types'
import controllers from '../controllers'
import { checkAppointments } from '../middleware/checkAppointments'
import { checkAnswers } from '../middleware/checkAnswers'
import { dateIsInPast } from '../utils'

const arrangeAppointmentRoutes = async (router: Router, { hmppsAuthClient }: Services) => {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  // intial redirect
  get('/case/:crn/arrange-appointment/sentence', controllers.arrangeAppointments.redirectToSentence())

  // GET
  // pre-steps for each page
  router.get('/case/:crn/arrange-appointment/:id/sentence', getSentences(hmppsAuthClient))
  router.get(
    '/case/:crn/arrange-appointment/:id/type-attendance',
    redirectWizard(['eventId']),
    getDefaultUser(hmppsAuthClient),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/attendance',
    redirectWizard(['eventId']),
    getUserOptions(hmppsAuthClient),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/location-date-time',
    redirectWizard(['eventId', 'type']),
    getTimeOptions,
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
  )
  router.get('/case/:crn/arrange-appointment/:id/location-not-in-list', redirectWizard(['eventId', 'type']))
  router.get('/case/:crn/arrange-appointment/:id/attended-complied', redirectWizard(['eventId', 'type', 'date']))
  router.get(
    '/case/:crn/arrange-appointment/:id/supporting-information',
    redirectWizard(['eventId', 'type', ['user', 'locationCode']]),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/check-your-answers',
    redirectWizard(['eventId']),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/confirmation',
    redirectWizard(['eventId', 'type', ['user', 'locationCode']]),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
  )
  // common pre-steps and final pre-step
  router.get(
    '/case/:crn/arrange-appointment/:id/*path',
    getAppointmentTypes(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
  )
  // load pages
  router.get('/case/:crn/arrange-appointment/:id/sentence', controllers.arrangeAppointments.getSentence())
  router.get('/case/:crn/arrange-appointment/:id/type-attendance', controllers.arrangeAppointments.getTypeAttendance())
  router.get('/case/:crn/arrange-appointment/:id/attendance', controllers.arrangeAppointments.getWhoWillAttend())
  router.get(
    '/case/:crn/arrange-appointment/:id/location-date-time',
    controllers.arrangeAppointments.getLocationDateTime(hmppsAuthClient),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/location-not-in-list',
    controllers.arrangeAppointments.getLocationNotInList(),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/attended-complied',
    controllers.arrangeAppointments.getAttendedComplied(),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/supporting-information',
    controllers.arrangeAppointments.getSupportingInformation(),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/check-your-answers',
    checkAnswers,
    controllers.arrangeAppointments.getCheckYourAnswers(),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/confirmation',
    controllers.arrangeAppointments.getConfirmation(hmppsAuthClient),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
    checkAnswers,
    controllers.arrangeAppointments.getArrangeAnotherAppointment(),
  )

  // POST
  // pre-steps for each page
  router.post('/case/:crn/arrange-appointment/:id/sentence', getSentences(hmppsAuthClient))
  router.post('/case/:crn/arrange-appointment/:id/location-date-time', getTimeOptions)
  // common pre-steps and final pre-steps
  router.post('/case/:crn/arrange-appointment/:id/*path', [
    autoStoreSessionData(hmppsAuthClient),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointmentTypes(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    checkAnswers,
  ])
  // complete post
  router.post(
    '/case/:crn/arrange-appointment/:id/sentence',
    validate.appointments,
    controllers.arrangeAppointments.postSentence(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/type-attendance',
    routeChangeAttendee,
    validate.appointments,
    controllers.arrangeAppointments.postTypeAttendance(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/attendance',
    validate.appointments,
    controllers.arrangeAppointments.postWhoWillAttend(hmppsAuthClient),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/location-date-time',
    validate.appointments,
    checkAppointments(hmppsAuthClient),
    controllers.arrangeAppointments.postLocationDateTime(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/attended-complied',
    validate.appointments,
    controllers.arrangeAppointments.postAttendedComplied(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/supporting-information',
    validate.appointments,
    controllers.arrangeAppointments.postSupportingInformation(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/check-your-answers',
    controllers.arrangeAppointments.postCheckYourAnswers(hmppsAuthClient),
  )
  router.post('/case/:crn/arrange-appointment/:id/confirmation', controllers.arrangeAppointments.postConfirmation())
  router.post(
    '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
    controllers.arrangeAppointments.postArrangeAnotherAppointment(hmppsAuthClient),
  )

  router.post('/alert/dismiss', (req, res) => {
    req.session.alertDismissed = true
    return res.json({ success: true })
  })
  router.post('/appointment/is-in-past', (req, res) => {
    const { date, time = '' } = req.body
    const alertDismissed = req?.session?.alertDismissed
    const { isInPast, isToday } = dateIsInPast(date, time)
    return res.json({ isInPast, isToday, alertDismissed })
  })
}

export default arrangeAppointmentRoutes
