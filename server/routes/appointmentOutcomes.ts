import { Router } from 'express'
import { Route } from '../@types'
import controllers from '../controllers'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { Services } from '../services'
import {
  autoStoreSessionData,
  getPersonAppointment,
  createAppointmentSession,
  getAppointmentTypes,
  getSentences,
  getAttendedCompliedProps,
  redirectWizard,
  checkAnswers,
} from '../middleware'
import validate from '../middleware/validation/index'

export default function appointmentOutcomesRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const arrangeBasePath = '/case/:crn/arrange-appointment/:id/outcome'
  const manageBasePath = '/case/:crn/appointments/appointment/:contactId/outcome'

  router.all(
    [manageBasePath, `${manageBasePath}/attended-complied`],
    getPersonAppointment(hmppsAuthClient),
    getAppointmentTypes(hmppsAuthClient),
    getSentences(hmppsAuthClient),
    createAppointmentSession,
  )
  router.all(
    [arrangeBasePath, manageBasePath, `${manageBasePath}/attended-complied`, `${arrangeBasePath}/attended-complied`],
    getAttendedCompliedProps,
  )
  router.get([arrangeBasePath, manageBasePath], controllers.appointmentOutcomes.getOutcome())
  router.post(
    [arrangeBasePath, `${arrangeBasePath}/*path`, manageBasePath, `${manageBasePath}/*path`],
    validate.appointmentOutcomes,
    autoStoreSessionData(hmppsAuthClient),
  )
  router.post([arrangeBasePath, manageBasePath], controllers.appointmentOutcomes.postOutcome())

  router.get(`${arrangeBasePath}/attended-complied`, redirectWizard(['eventId', 'type', 'date']))

  router.get(
    [`${arrangeBasePath}/attended-complied`, `${manageBasePath}/attended-complied`],
    controllers.appointmentOutcomes.getAttendedComplied(hmppsAuthClient),
  )

  router.post(`${arrangeBasePath}/attended-complied`, checkAnswers)

  router.post(
    [`${arrangeBasePath}/attended-complied`, `${manageBasePath}/attended-complied`],
    controllers.appointmentOutcomes.postAttendedComplied(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/appointments/appointment/:contactId/outcome/attended-failed-to-comply',
    controllers.appointmentOutcomes.getAttendedFailedToComply(),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/outcome/attended-failed-to-comply',
    controllers.appointmentOutcomes.postAttendedFailedToComply(),
  )
  router.get(
    '/case/:crn/appointments/appointment/:contactId/outcome/acceptable-absence',
    controllers.appointmentOutcomes.getAcceptableAbsence(),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/outcome/acceptable-absence',
    controllers.appointmentOutcomes.postAcceptableAbsence(),
  )
  router.get(
    '/case/:crn/appointments/appointment/:contactId/outcome/unacceptable-absence',
    controllers.appointmentOutcomes.getUnacceptableAbsence(),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/outcome/unacceptable-absence',
    controllers.appointmentOutcomes.postUnacceptableAbsence(),
  )
  router.get(
    '/case/:crn/appointments/appointment/:contactId/outcome/enforcement-action',
    controllers.appointmentOutcomes.getEnforcementAction(),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/outcome/enforcement-action',
    controllers.appointmentOutcomes.postEnforcementAction(),
  )
  router.get(
    '/case/:crn/appointments/appointment/:contactId/outcome/failed-to-attend',
    controllers.appointmentOutcomes.getFailedToAttend(),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/outcome/failed-to-attend',
    controllers.appointmentOutcomes.postFailedToAttend(),
  )
  router.get(
    '/case/:crn/appointments/appointment/:contactId/outcome/initiate-breach-or-recall',
    controllers.appointmentOutcomes.getInitiateBreachOrRecall(),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/outcome/initiate-breach-or-recall',
    controllers.appointmentOutcomes.postInitiateBreachOrRecall(),
  )
  router.get(
    '/case/:crn/appointments/appointment/:contactId/outcome/send-letter',
    controllers.appointmentOutcomes.getSendLetter(),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/outcome/send-letter',
    controllers.appointmentOutcomes.postSendLetter(),
  )
  router.get(
    '/case/:crn/appointments/appointment/:contactId/outcome/update-enforcement-action',
    controllers.appointmentOutcomes.getUpdateEnforcementAction(),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/outcome/update-enforcement-action',
    controllers.appointmentOutcomes.postUpdateEnforcementAction(),
  )
}
