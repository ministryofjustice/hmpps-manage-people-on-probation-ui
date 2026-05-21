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
  redirectWizard,
  getPersonalDetails,
  getNextComAppointment,
} from '../middleware'

import {
  getAttendedFailedToComplyOptions,
  getBackLink,
  getAcceptableAbsenceOptions,
  getEnforcementActionOptions,
  getBreachNSICreatedByOptions,
  getSendLetterOptions,
  getOutcomeEvidenceBy,
  getOutcomeOptions,
  getOutcomeProps,
  getFailedToAttendOptions,
  saveMappedCode,
  getUpdateEnforcementActionOptions,
  getCurrentEnforcementAction,
  getContactOutcomes,
  getOutcomeSummary,
  getNotePrepend,
  resetSelectedActions,
} from '../middleware/appointment-outcomes'

import validate from '../middleware/validation/index'
import { handleEnforcementActionRedirect } from '../middleware/appointment-outcomes/handleEnforcementActionRedirect'

export default function appointmentOutcomesRoutes(router: Router, { hmppsAuthClient, arnsComponents }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const arrangeBasePath = '/case/:crn/arrange-appointment/:id/outcome'
  const manageBasePath = '/case/:crn/appointments/appointment/:contactId/outcome'

  /* get person appointment and create appointment session only in manage routes 👇 */

  router.all(
    [manageBasePath, `${manageBasePath}/*path`],
    getPersonAppointment(hmppsAuthClient),
    getAppointmentTypes(hmppsAuthClient),
    getSentences(hmppsAuthClient),
  )

  /* create appointment session in manage journey 👇 */

  router.get([manageBasePath, `${manageBasePath}/update-enforcement-action`], createAppointmentSession)

  /* redirect page if required session data is not present 👇  */

  router.get(arrangeBasePath, redirectWizard(['eventId', 'type', 'date']))

  /* get the contact outcomes and enforcement actions from api 👇 */

  router.get(
    [arrangeBasePath, manageBasePath, `${arrangeBasePath}/*path`, `${manageBasePath}/*path`],
    getContactOutcomes(hmppsAuthClient),
  )

  /* get outcome props for all outcome routes 👇 */

  router.all(
    [arrangeBasePath, manageBasePath, `${arrangeBasePath}/*path`, `${manageBasePath}/*path`],
    getOutcomeProps,
    getBackLink,
  )

  /* get readable enforcement action from current appointment 👇 */

  router.all(
    [`${manageBasePath}/update-enforcement-action`, `${manageBasePath}/enforcement-action`],
    getCurrentEnforcementAction,
  )

  /* run the outcome page options middleware before validation 👇 */

  router.all([arrangeBasePath, manageBasePath], getOutcomeOptions)

  router.all(
    [
      `${arrangeBasePath}/attended-failed-to-comply`,
      `${manageBasePath}/attended-failed-to-comply`,
      `${arrangeBasePath}/unacceptable-absence`,
      `${manageBasePath}/unacceptable-absence`,
    ],
    getAttendedFailedToComplyOptions,
  )

  router.all(
    [`${arrangeBasePath}/acceptable-absence`, `${manageBasePath}/acceptable-absence`],
    getAcceptableAbsenceOptions,
  )

  router.all(
    [`${arrangeBasePath}/failed-to-attend`, `${manageBasePath}/failed-to-attend`],
    getFailedToAttendOptions,
    getOutcomeEvidenceBy,
  )

  router.all(
    [`${arrangeBasePath}/enforcement-action`, `${manageBasePath}/enforcement-action`],
    getEnforcementActionOptions,
  )

  router.all(
    [`${arrangeBasePath}/initiate-breach-or-recall`, `${manageBasePath}/initiate-breach-or-recall`],
    getBreachNSICreatedByOptions,
  )

  router.all(`${manageBasePath}/update-enforcement-action`, getUpdateEnforcementActionOptions)

  router.all(
    [
      `${arrangeBasePath}/initiate-breach-or-recall`,
      `${manageBasePath}/initiate-breach-or-recall`,
      `${arrangeBasePath}/send-letter`,
      `${manageBasePath}/send-letter`,
    ],
    getSendLetterOptions,
  )

  /* validate outcome options and store session data on all outcome post routes 👇  */

  router.post(
    [arrangeBasePath, manageBasePath, `${arrangeBasePath}/*path`, `${manageBasePath}/*path`],
    validate.appointmentOutcomes,
    autoStoreSessionData(hmppsAuthClient),
  )

  /* save the mapped outcome and action code 👇 */

  router.post([arrangeBasePath, manageBasePath], saveMappedCode('OUTCOME'))
  router.post([`${arrangeBasePath}/*path`, `${manageBasePath}/*path`], saveMappedCode('ACTION'))

  /* Outcome index 👇 */

  router.get([arrangeBasePath, manageBasePath], controllers.appointmentOutcomes.getOutcome(hmppsAuthClient))
  router.post([arrangeBasePath, manageBasePath], resetSelectedActions(), controllers.appointmentOutcomes.postOutcome())

  /* Attended - failed to comply 👇 */

  router.all(
    [`${arrangeBasePath}/attended-failed-to-comply`, `${manageBasePath}/attended-failed-to-comply`],
    getPersonalDetails(hmppsAuthClient, arnsComponents),
  )
  router.get(
    [`${arrangeBasePath}/attended-failed-to-comply`, `${manageBasePath}/attended-failed-to-comply`],
    controllers.appointmentOutcomes.getAttendedFailedToComply(hmppsAuthClient),
  )

  /* Reset secondary enforcement action selections 👇 */

  router.post(
    [
      `${arrangeBasePath}/attended-failed-to-comply`,
      `${manageBasePath}/attended-failed-to-comply`,
      `${arrangeBasePath}/acceptable-absence`,
      `${manageBasePath}/acceptable-absence`,
      `${arrangeBasePath}/unacceptable-absence`,
      `${manageBasePath}/unacceptable-absence`,
      `${arrangeBasePath}/failed-to-attend`,
      `${manageBasePath}/failed-to-attend`,
      `${arrangeBasePath}/enforcement-action`,
      `${manageBasePath}/enforcement-action`,
    ],
    resetSelectedActions(['breachNSICreatedBy', 'letterSentBy', 'letterType']),
  )

  router.post(
    [`${arrangeBasePath}/attended-failed-to-comply`, `${manageBasePath}/attended-failed-to-comply`],
    handleEnforcementActionRedirect('attendedFailedToComply'),
  )

  /* Acceptable absence 👇 */

  router.get(
    [`${arrangeBasePath}/acceptable-absence`, `${manageBasePath}/acceptable-absence`],
    controllers.appointmentOutcomes.getAcceptableAbsence(hmppsAuthClient),
  )
  router.post(
    [`${arrangeBasePath}/acceptable-absence`, `${manageBasePath}/acceptable-absence`],
    handleEnforcementActionRedirect('acceptableAbsence'),
  )

  /* Uncceptable absence 👇 */

  router.get(
    [`${arrangeBasePath}/unacceptable-absence`, `${manageBasePath}/unacceptable-absence`],
    controllers.appointmentOutcomes.getUnacceptableAbsence(hmppsAuthClient),
  )
  router.post(
    [`${arrangeBasePath}/unacceptable-absence`, `${manageBasePath}/unacceptable-absence`],
    handleEnforcementActionRedirect('unacceptableAbsence'),
  )

  /* Failed to attend 👇 */

  router.get(
    [`${arrangeBasePath}/failed-to-attend`, `${manageBasePath}/failed-to-attend`],
    controllers.appointmentOutcomes.getFailedToAttend(hmppsAuthClient),
  )
  router.post(
    [`${arrangeBasePath}/failed-to-attend`, `${manageBasePath}/failed-to-attend`],
    handleEnforcementActionRedirect('failedToAttend'),
  )

  /* Other enforcement action 👇 */

  router.get(
    [`${arrangeBasePath}/enforcement-action`, `${manageBasePath}/enforcement-action`],
    controllers.appointmentOutcomes.getEnforcementAction(),
  )
  router.post(
    [`${arrangeBasePath}/enforcement-action`, `${manageBasePath}/enforcement-action`],
    handleEnforcementActionRedirect('otherEnforcementAction'),
  )

  /* Initiate breach or recall 👇 */

  router.get(
    [`${arrangeBasePath}/initiate-breach-or-recall`, `${manageBasePath}/initiate-breach-or-recall`],
    controllers.appointmentOutcomes.getInitiateBreachOrRecall(hmppsAuthClient),
  )
  router.post(
    [`${arrangeBasePath}/initiate-breach-or-recall`, `${manageBasePath}/initiate-breach-or-recall`],
    handleEnforcementActionRedirect('breachNSICreatedBy'),
  )

  /* Send a letter 👇 */

  router.get(
    [`${arrangeBasePath}/send-letter`, `${manageBasePath}/send-letter`],
    controllers.appointmentOutcomes.getSendLetter(hmppsAuthClient),
  )
  router.post(
    [`${arrangeBasePath}/send-letter`, `${manageBasePath}/send-letter`],
    handleEnforcementActionRedirect('letterType'),
  )

  /* Update enforcement action 👇 */

  router.get(
    [`${arrangeBasePath}/update-enforcement-action`, `${manageBasePath}/update-enforcement-action`],
    controllers.appointmentOutcomes.getUpdateEnforcementAction(hmppsAuthClient),
  )
  router.post(
    [`${arrangeBasePath}/update-enforcement-action`, `${manageBasePath}/update-enforcement-action`],
    handleEnforcementActionRedirect('updateEnforcementAction'),
  )

  /* Add note page in arrange journey (no file upload) 👇 */

  router.get(`${arrangeBasePath}/add-note`, controllers.appointmentOutcomes.getAddNote(hmppsAuthClient))
  router.post([`${arrangeBasePath}/add-note`], controllers.appointmentOutcomes.postAddNote(hmppsAuthClient))
  router.get(`${arrangeBasePath}/add-note`, controllers.appointmentOutcomes.getAddNote(hmppsAuthClient))

  /* Check your answers page in manage journey 👇 */

  router.get(
    [`${manageBasePath}/check-your-answers`],
    getNextComAppointment(hmppsAuthClient),
    getNotePrepend,
    getOutcomeSummary,
    controllers.appointmentOutcomes.getCheckYourAnswers(hmppsAuthClient),
  )
  router.post(
    [`${manageBasePath}/check-your-answers`],
    controllers.appointmentOutcomes.postCheckYourAnswers(hmppsAuthClient),
  )

  router.get(`${arrangeBasePath}/add-note`, controllers.appointmentOutcomes.getAddNote(hmppsAuthClient))

  router.post([`${arrangeBasePath}/add-note`], controllers.appointmentOutcomes.postAddNote(hmppsAuthClient))
}
