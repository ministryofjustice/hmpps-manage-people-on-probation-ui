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
  getPersonalDetails,
  getNextComAppointment,
  getAppointment,
  getUserProviders,
  forceValidation,
  getOverdueOutcomes,
} from '../middleware'

import {
  getAttendedFailedToComplyOptions,
  getBackLink,
  getAcceptableAbsenceOptions,
  getEnforcementActionOptions,
  getBreachNSICreatedByOptions,
  getSendLetterOptions,
  getOutcomeOptions,
  getOutcomeProps,
  getFailedToAttendOptions,
  saveMappedCode,
  getUpdateEnforcementActionOptions,
  getCurrentEnforcementAction,
  getOutcomeSummary,
  getConfirmation,
  getNotePrepend,
  resetSelectedActions,
  restrictPageAccess,
  getBreachOrRecallWarning,
  getContactOutcomes,
  handlePutOutcome,
  getOutcomeSentence,
  getFailedToAttendTicket,
  getTicket,
  changeActionsReset,
} from '../middleware/appointment-outcomes'

import validate from '../middleware/validation/index'
import { handleOutcomePageRedirect } from '../middleware/appointment-outcomes/handleOutcomePageRedirect'

export default function appointmentOutcomesRoutes(router: Router, { hmppsAuthClient, arnsComponents }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const arrangeBasePath = '/case/:crn/arrange-appointment/:id/outcome'
  const manageBasePath = '/case/:crn/appointments/appointment/:contactId/outcome'

  /* restrict page access if required session data is not present 👇  */

  router.get(
    [arrangeBasePath, manageBasePath, `${arrangeBasePath}/*path`, `${manageBasePath}/*path`],
    restrictPageAccess,
  )

  /* get person appointment and create appointment session only in manage routes 👇 */

  router.all(
    [manageBasePath, `${manageBasePath}/*path`],
    getPersonAppointment(hmppsAuthClient),
    getAppointmentTypes(hmppsAuthClient),
    getSentences(hmppsAuthClient),
  )

  /* create appointment session in manage journey 👇 */

  router.get([manageBasePath, `${manageBasePath}/update-enforcement-action`], createAppointmentSession)

  /* get the contact outcomes and enforcement actions from api 👇 */

  router.get(
    [arrangeBasePath, manageBasePath, `${arrangeBasePath}/*path`, `${manageBasePath}/*path`],
    getContactOutcomes(hmppsAuthClient),
  )

  /* get outcome props for all outcome routes 👇 */

  router.all(
    [arrangeBasePath, manageBasePath, `${arrangeBasePath}/*path`, `${manageBasePath}/*path`],
    getOutcomeProps,
    getOutcomeSentence(hmppsAuthClient),
    getBackLink,
    getBreachOrRecallWarning,
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
    getTicket(hmppsAuthClient),
  )

  router.all(
    [`${arrangeBasePath}/acceptable-absence`, `${manageBasePath}/acceptable-absence`],
    getAcceptableAbsenceOptions,
    getTicket(hmppsAuthClient),
  )

  router.all(
    [`${arrangeBasePath}/failed-to-attend`, `${manageBasePath}/failed-to-attend`],
    getFailedToAttendOptions,
    getFailedToAttendTicket,
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
    changeActionsReset,
    autoStoreSessionData(hmppsAuthClient),
  )

  /* save the mapped outcome and action code 👇 */

  router.post([arrangeBasePath, manageBasePath], saveMappedCode('OUTCOME'))

  router.post(
    [`${arrangeBasePath}/acceptable-absence`, `${manageBasePath}/acceptable-absence`],
    saveMappedCode('ACCEPTABLE_ABSENCE_OUTCOME'),
  )

  router.post(
    [
      `${arrangeBasePath}/attended-failed-to-comply`,
      `${manageBasePath}/attended-failed-to-comply`,
      `${arrangeBasePath}/unacceptable-absence`,
      `${manageBasePath}/unacceptable-absence`,
      `${arrangeBasePath}/failed-to-attend`,
      `${manageBasePath}/failed-to-attend`,
      `${arrangeBasePath}/enforcement-action`,
      `${manageBasePath}/enforcement-action`,
      `${arrangeBasePath}/initiate-breach-or-recall`,
      `${manageBasePath}/initiate-breach-or-recall`,
      `${arrangeBasePath}/send-letter`,
      `${manageBasePath}/send-letter`,
      `${manageBasePath}/update-enforcement-action`,
    ],
    saveMappedCode('ACTION'),
  )

  /* Outcome index 👇 */

  router.get([arrangeBasePath, manageBasePath], forceValidation, controllers.appointmentOutcomes.getOutcome())
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
      `${arrangeBasePath}/unacceptable-absence`,
      `${manageBasePath}/unacceptable-absence`,
      `${arrangeBasePath}/failed-to-attend`,
      `${manageBasePath}/failed-to-attend`,
    ],
    resetSelectedActions(['otherEnforcementAction']),
  )

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
    handleOutcomePageRedirect('attendedFailedToComply'),
  )

  /* Acceptable absence 👇 */

  router.get(
    [`${arrangeBasePath}/acceptable-absence`, `${manageBasePath}/acceptable-absence`],
    controllers.appointmentOutcomes.getAcceptableAbsence(),
  )
  router.post(
    [`${arrangeBasePath}/acceptable-absence`, `${manageBasePath}/acceptable-absence`],
    handleOutcomePageRedirect('acceptableAbsence'),
  )

  /* Uncceptable absence 👇 */

  router.get(
    [`${arrangeBasePath}/unacceptable-absence`, `${manageBasePath}/unacceptable-absence`],
    controllers.appointmentOutcomes.getUnacceptableAbsence(),
  )
  router.post(
    [`${arrangeBasePath}/unacceptable-absence`, `${manageBasePath}/unacceptable-absence`],
    handleOutcomePageRedirect('unacceptableAbsence'),
  )

  /* Failed to attend 👇 */

  router.get(
    [`${arrangeBasePath}/failed-to-attend`, `${manageBasePath}/failed-to-attend`],
    controllers.appointmentOutcomes.getFailedToAttend(),
  )
  router.post(
    [`${arrangeBasePath}/failed-to-attend`, `${manageBasePath}/failed-to-attend`],
    handleOutcomePageRedirect('failedToAttend'),
  )

  /* Other enforcement action 👇 */

  router.get(
    [`${arrangeBasePath}/enforcement-action`, `${manageBasePath}/enforcement-action`],
    controllers.appointmentOutcomes.getEnforcementAction(),
  )
  router.post(
    [`${arrangeBasePath}/enforcement-action`, `${manageBasePath}/enforcement-action`],
    handleOutcomePageRedirect('otherEnforcementAction'),
  )

  /* Initiate breach or recall 👇 */

  router.get(
    [`${arrangeBasePath}/initiate-breach-or-recall`, `${manageBasePath}/initiate-breach-or-recall`],
    controllers.appointmentOutcomes.getInitiateBreachOrRecall(),
  )
  router.post(
    [`${arrangeBasePath}/initiate-breach-or-recall`, `${manageBasePath}/initiate-breach-or-recall`],
    handleOutcomePageRedirect('breachNSICreatedBy'),
  )

  /* Send a letter 👇 */

  router.get(
    [`${arrangeBasePath}/send-letter`, `${manageBasePath}/send-letter`],
    controllers.appointmentOutcomes.getSendLetter(),
  )
  router.post(
    [`${arrangeBasePath}/send-letter`, `${manageBasePath}/send-letter`],
    handleOutcomePageRedirect('letterType'),
  )

  /* Update enforcement action 👇 */

  router.get(
    `${manageBasePath}/update-enforcement-action`,
    controllers.appointmentOutcomes.getUpdateEnforcementAction(),
  )
  router.post(`${manageBasePath}/update-enforcement-action`, handleOutcomePageRedirect('updateEnforcementAction'))

  router.all(
    `${manageBasePath}/next-appointment`,
    getNextComAppointment(hmppsAuthClient),
    getAppointmentTypes(hmppsAuthClient),
    getUserProviders(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
  )
  router.get(`${manageBasePath}/next-appointment`, controllers.appointments.getNextAppointment(hmppsAuthClient))

  router.post(
    `${manageBasePath}/next-appointment`,
    validate.appointmentOutcomes,
    controllers.appointments.postNextAppointment(hmppsAuthClient),
  )

  router.all(`${manageBasePath}/check-your-answers`, getNotePrepend)

  router.get(
    `${manageBasePath}/check-your-answers`,
    getNextComAppointment(hmppsAuthClient),
    getOutcomeSummary,
    controllers.appointmentOutcomes.getCheckYourAnswers(hmppsAuthClient),
  )
  router.post(
    `${manageBasePath}/check-your-answers`,
    handlePutOutcome(hmppsAuthClient),
    controllers.appointmentOutcomes.postCheckYourAnswers(hmppsAuthClient),
  )

  /* Add note page in arrange journey (no file upload) 👇 */

  router.all(`${arrangeBasePath}/add-note`, getNotePrepend)
  router.get(
    `${arrangeBasePath}/add-note`,
    forceValidation,
    controllers.appointmentOutcomes.getAddNote(hmppsAuthClient),
  )
  router.post([`${arrangeBasePath}/add-note`], controllers.appointmentOutcomes.postAddNote(hmppsAuthClient))

  /* Confirmation 👇 */

  router.get(
    `${manageBasePath}/confirmation`,
    getOverdueOutcomes(hmppsAuthClient),
    getConfirmation,
    controllers.appointmentOutcomes.getConfirmation(hmppsAuthClient),
  )
}
