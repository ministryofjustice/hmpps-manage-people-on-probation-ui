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
import { checkAnswers } from '../middleware/checkAnswers'
import { dateIsInPast } from '../utils'

const arrangeAppointmentRoutes = async (router: Router, { hmppsAuthClient }: Services) => {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  router.all(
    '/case/:crn/arrange-appointment/:id/*path',
    getAppointmentTypes(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient),
    getWhoAttends(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
  )
  router.all('/case/:crn/arrange-appointment/:id/sentence', getSentences(hmppsAuthClient))
  get('/case/:crn/arrange-appointment/sentence', controllers.arrangeAppointments.redirectToSentence())
  get('/case/:crn/arrange-appointment/:id/sentence', controllers.arrangeAppointments.getSentence())

  router.post('/case/:crn/arrange-appointment/:id/*path', [
    autoStoreSessionData(hmppsAuthClient),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getWhoAttends(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    checkAnswers,
  ])

  router.post(
    '/case/:crn/arrange-appointment/:id/sentence',
    validate.appointments,
    controllers.arrangeAppointments.postSentence(),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/type-attendance',
    redirectWizard(['eventId']),
    controllers.arrangeAppointments.getTypeAttendance(),
  )

  router.post(
    '/case/:crn/arrange-appointment/:id/type-attendance',
    validate.appointments,
    controllers.arrangeAppointments.postTypeAttendance(),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/attendance',
    redirectWizard(['eventId']),
    controllers.arrangeAppointments.getWhoWillAttend(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/attendance',
    validate.appointments,
    controllers.arrangeAppointments.postWhoWillAttend(),
  )

  router.all('/case/:crn/arrange-appointment/:id/location-date-time', getTimeOptions)
  router.get(
    '/case/:crn/arrange-appointment/:id/location-date-time',
    redirectWizard(['eventId', 'type']),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    controllers.arrangeAppointments.getLocationDateTime(hmppsAuthClient),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/location-date-time',
    validate.appointments,
    checkAppointments(hmppsAuthClient),
    controllers.arrangeAppointments.postLocationDateTime(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/location-not-in-list',
    redirectWizard(['eventId', 'type']),
    controllers.arrangeAppointments.getLocationNotInList(),
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
    '/case/:crn/arrange-appointment/:id/supporting-information',
    redirectWizard(['eventId', 'type', ['user', 'locationCode'], 'repeating']),
    controllers.arrangeAppointments.getSupportingInformation(),
  )

  router.post(
    '/case/:crn/arrange-appointment/:id/supporting-information',
    validate.appointments,
    controllers.arrangeAppointments.postSupportingInformation(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/check-your-answers',
    redirectWizard(['eventId', 'repeating']),
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    checkAnswers,
    controllers.arrangeAppointments.getCheckYourAnswers(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/check-your-answers',
    controllers.arrangeAppointments.postCheckYourAnswers(hmppsAuthClient),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/confirmation',
    redirectWizard(['eventId', 'type', ['user', 'locationCode'], 'repeating']),
    controllers.arrangeAppointments.getConfirmation(),
  )
  router.post('/case/:crn/arrange-appointment/:id/confirmation', controllers.arrangeAppointments.postConfirmation())
  router.get(
    '/case/:crn/arrange-appointment/:id/arrange-another-appointment',
    getOfficeLocationsByTeamAndProvider(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
    checkAnswers,
    controllers.arrangeAppointments.getArrangeAnotherAppointment(),
  )
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
