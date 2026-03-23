import { Router } from 'express'
import { Route } from '../@types'
import controllers from '../controllers'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { Services } from '../services'

export default function appointmentOutcomesRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  router.get('/case/:crn/appointments/appointment/:contactId/outcome', controllers.appointmentOutcomes.getOutcome())
  router.post('/case/:crn/appointments/appointment/:contactId/outcome', controllers.appointmentOutcomes.postOutcome())
  router.get(
    '/case/:crn/appointments/appointment/:contactId/failed-to-comply',
    controllers.appointmentOutcomes.getFailedToComply(),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/failed-to-comply',
    controllers.appointmentOutcomes.postFailedToComply(),
  )
  router.get(
    '/case/:crn/appointments/appointment/:contactId/acceptable-absence',
    controllers.appointmentOutcomes.getAcceptableAbsence(),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/acceptable-absence',
    controllers.appointmentOutcomes.postAcceptableAbsence(),
  )
  router.get(
    '/case/:crn/appointments/appointment/:contactId/enforcement-action',
    controllers.appointmentOutcomes.getEnforcementAction(),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/enforcement-action',
    controllers.appointmentOutcomes.postEnforcementAction(),
  )
  router.get(
    '/case/:crn/appointments/appointment/:contactId/initiate-breach-or-recall',
    controllers.appointmentOutcomes.getInitiateBreachOrRecall(),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/initiate-breach-or-recall',
    controllers.appointmentOutcomes.postInitiateBreachOrRecall(),
  )
  router.get(
    '/case/:crn/appointments/appointment/:contactId/send-letter',
    controllers.appointmentOutcomes.getSendLetter(),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/send-letter',
    controllers.appointmentOutcomes.postSendLetter(),
  )
  router.get(
    '/case/:crn/appointments/appointment/:contactId/update-enforcement-action',
    controllers.appointmentOutcomes.getUpdateEnforcementAction(),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/update-enforcement-action',
    controllers.appointmentOutcomes.postUpdateEnforcementAction(),
  )
}
