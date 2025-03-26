import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import {
  autoStoreSessionData,
  getPersonalDetails,
  getUserLocations,
  getSentences,
  getAppointment,
  redirectWizard,
} from '../middleware/index'
import type { Services } from '../services'
import validate from '../middleware/validation/index'
import { postAppointments } from '../middleware/postAppointments'
import { getTimeOptions } from '../middleware/getTimeOptions'
import type { AppResponse, Route } from '../@types'
import controllers from '../controllers'

const arrangeAppointmentRoutes = async (router: Router, { hmppsAuthClient }: Services) => {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  router.all('/case/:crn/arrange-appointment/:id/*', (req, res: AppResponse, next) => {
    res.locals.change = req.query.change as string
    return next()
  })
  get('/case/:crn/arrange-appointment/type', controllers.arrangeAppointments.redirectToType())

  router.all('/case/:crn/arrange-appointment/:id/type', controllers.arrangeAppointments.getOrPostType())

  get('/case/:crn/arrange-appointment/:id/type', controllers.arrangeAppointments.getType())

  router.all('/case/:crn/arrange-appointment/:id/*', getAppointment)

  router.post('/case/:crn/arrange-appointment/:id/*', autoStoreSessionData)

  router.post(
    '/case/:crn/arrange-appointment/:id/type',
    validate.appointments,
    controllers.arrangeAppointments.postType(),
  )

  router.all('/case/:crn/arrange-appointment/:id/sentence', getSentences(hmppsAuthClient))

  router.get(
    '/case/:crn/arrange-appointment/:id/sentence',
    redirectWizard(['type']),
    controllers.arrangeAppointments.getSentence(),
  )

  router.post(
    '/case/:crn/arrange-appointment/:id/sentence',
    validate.appointments,
    controllers.arrangeAppointments.postSentence(),
  )

  router.all('/case/:crn/arrange-appointment/:id/location', getUserLocations(hmppsAuthClient))

  router.get(
    '/case/:crn/arrange-appointment/:id/location',
    redirectWizard(['type', 'sentence']),
    controllers.arrangeAppointments.getLocation(),
  )

  router.post(
    '/case/:crn/arrange-appointment/:id/location',
    validate.appointments,
    controllers.arrangeAppointments.postLocation(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/location-not-in-list',
    getPersonalDetails(hmppsAuthClient),
    controllers.arrangeAppointments.getLocationNotInList(),
  )

  router.all('/case/:crn/arrange-appointment/:id/date-time', getPersonalDetails(hmppsAuthClient), getTimeOptions)

  router.get(
    '/case/:crn/arrange-appointment/:id/date-time',
    redirectWizard(['type', 'sentence', 'location']),
    controllers.arrangeAppointments.getDateTime(),
  )

  router.post(
    '/case/:crn/arrange-appointment/:id/date-time',
    validate.appointments,
    controllers.arrangeAppointments.postDateTime(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/repeating',
    redirectWizard(['type', 'sentence', 'location', 'date']),
    controllers.arrangeAppointments.getRepeating(),
  )

  router.post(
    '/case/:crn/arrange-appointment/:id/repeating',
    validate.appointments,
    controllers.arrangeAppointments.postRepeating(),
  )

  router.get(
    '/case/:crn/arrange-appointment/:id/preview',
    redirectWizard(['type', 'sentence', 'location', 'date', 'repeating']),
    controllers.arrangeAppointments.getPreview(),
  )

  router.post('/case/:crn/arrange-appointment/:id/preview', controllers.arrangeAppointments.postPreview())

  router.get(
    '/case/:crn/arrange-appointment/:id/check-your-answers',
    redirectWizard(['type', 'sentence', 'location', 'date', 'repeating']),
    getUserLocations(hmppsAuthClient),
    controllers.arrangeAppointments.getCheckYourAnswers(),
  )
  router.post(
    '/case/:crn/arrange-appointment/:id/check-your-answers',
    postAppointments(hmppsAuthClient),
    controllers.arrangeAppointments.postCheckYourAnswers(),
  )
  router.get(
    '/case/:crn/arrange-appointment/:id/confirmation',
    getPersonalDetails(hmppsAuthClient),
    controllers.arrangeAppointments.getConfirmation(),
  )
  router.post('/case/:crn/arrange-appointment/:id/confirmation', controllers.arrangeAppointments.postConfirmation())
}

export default arrangeAppointmentRoutes
