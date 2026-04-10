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
  getAppointmentOutcomeProps,
  getAppointmentOutcomeOptions,
  redirectWizard,
  getPersonalDetails,
  checkAnswers,
} from '../middleware'
import validate from '../middleware/validation/index'
import { getAppointmentOutcomeBackLink } from '../middleware/getAppointmentOutcomeBackLink'

export default function appointmentOutcomesRoutes(router: Router, { hmppsAuthClient, arnsComponents }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const arrangeBasePath = '/case/:crn/arrange-appointment/:id/outcome'
  const manageBasePath = '/case/:crn/appointments/appointment/:contactId/outcome'

  /* get person appointment and create appointment session only in manage routes */

  router.all(
    [manageBasePath, `${manageBasePath}/*path`],
    getPersonAppointment(hmppsAuthClient),
    getAppointmentTypes(hmppsAuthClient),
    getSentences(hmppsAuthClient),
    createAppointmentSession,
  )

  /* redirect page if required session data is not present */

  router.get(arrangeBasePath, redirectWizard(['eventId', 'type', 'date']))

  /* get outcome props for all outcome routes */

  router.all(
    [arrangeBasePath, manageBasePath, `${arrangeBasePath}/*path`, `${manageBasePath}/*path`],
    getAppointmentOutcomeProps,
    getAppointmentOutcomeBackLink,
  )

  /* get outcome options only on the outcome page */

  router.all([arrangeBasePath, manageBasePath], getAppointmentOutcomeOptions)

  /* validate outcome options and store session data on all outcome post routes */

  router.post(
    [arrangeBasePath, manageBasePath, `${arrangeBasePath}/*path`, `${manageBasePath}/*path`],
    validate.appointmentOutcomes,
    autoStoreSessionData(hmppsAuthClient),
  )

  /* Outcome index  */

  router.get([arrangeBasePath, manageBasePath], controllers.appointmentOutcomes.getOutcome())
  router.post([arrangeBasePath, manageBasePath], controllers.appointmentOutcomes.postOutcome())

  /* Add note */

  router.all(`${manageBasePath}/add-note`, getPersonAppointment(hmppsAuthClient))

  router.get(
    [`${arrangeBasePath}/add-note`, `${manageBasePath}/add-note`],
    controllers.appointmentOutcomes.getAddNote(hmppsAuthClient),
  )

  router.post(
    [`${arrangeBasePath}/add-note`, `${manageBasePath}/add-note`],
    controllers.appointmentOutcomes.postAddNote(hmppsAuthClient),
  )

  /* Failed to comply */

  router.all(
    [`${arrangeBasePath}/attended-failed-to-comply`, `${manageBasePath}/attended-failed-to-comply`],
    getPersonalDetails(hmppsAuthClient, arnsComponents),
  )
  router.get(
    [`${arrangeBasePath}/attended-failed-to-comply`, `${manageBasePath}/attended-failed-to-comply`],
    controllers.appointmentOutcomes.getAttendedFailedToComply(hmppsAuthClient),
  )
  router.post(
    [`${arrangeBasePath}/attended-failed-to-comply`, `${manageBasePath}/attended-failed-to-comply`],
    controllers.appointmentOutcomes.postAttendedFailedToComply(),
  )
  router.get(
    [`${arrangeBasePath}/acceptable-absence`, `${manageBasePath}/acceptable-absence`],
    controllers.appointmentOutcomes.getAcceptableAbsence(),
  )
  router.post(
    [`${arrangeBasePath}/acceptable-absence`, `${manageBasePath}/acceptable-absence`],
    controllers.appointmentOutcomes.postAcceptableAbsence(),
  )
  router.get(
    [`${arrangeBasePath}/unacceptable-absence`, `${manageBasePath}/unacceptable-absence`],
    controllers.appointmentOutcomes.getUnacceptableAbsence(),
  )
  router.post(
    [`${arrangeBasePath}/unacceptable-absence`, `${manageBasePath}/unacceptable-absence`],
    controllers.appointmentOutcomes.postUnacceptableAbsence(),
  )
  router.get(
    [`${arrangeBasePath}/enforcement-action`, `${manageBasePath}/enforcement-action`],
    controllers.appointmentOutcomes.getEnforcementAction(),
  )
  router.post(
    [`${arrangeBasePath}/enforcement-action`, `${manageBasePath}/enforcement-action`],
    controllers.appointmentOutcomes.postEnforcementAction(),
  )
  router.get(
    [`${arrangeBasePath}/failed-to-attend`, `${manageBasePath}/failed-to-attend`],
    controllers.appointmentOutcomes.getFailedToAttend(),
  )
  router.post(
    [`${arrangeBasePath}/failed-to-attend`, `${manageBasePath}/failed-to-attend`],
    controllers.appointmentOutcomes.postFailedToAttend(),
  )
  router.get(
    [`${arrangeBasePath}/initiate-breach-or-recall`, `${manageBasePath}/initiate-breach-or-recall`],
    controllers.appointmentOutcomes.getInitiateBreachOrRecall(),
  )
  router.post(
    [`${arrangeBasePath}/initiate-breach-or-recall`, `${manageBasePath}/initiate-breach-or-recall`],
    controllers.appointmentOutcomes.postInitiateBreachOrRecall(),
  )
  router.get(
    [`${arrangeBasePath}/send-letter`, `${manageBasePath}/send-letter`],
    controllers.appointmentOutcomes.getSendLetter(),
  )
  router.post(
    [`${arrangeBasePath}/send-letter`, `${manageBasePath}/send-letter`],
    controllers.appointmentOutcomes.postSendLetter(),
  )
  router.get(
    [`${arrangeBasePath}/update-enforcement-action`, `${manageBasePath}/update-enforcement-action`],
    controllers.appointmentOutcomes.getUpdateEnforcementAction(),
  )
  router.post(
    [`${arrangeBasePath}/update-enforcement-action`, `${manageBasePath}/update-enforcement-action`],
    controllers.appointmentOutcomes.postUpdateEnforcementAction(),
  )
}
