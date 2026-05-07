import { Route } from '../../@types'
import { appointmentOutcomesValidation } from '../../properties'
import { urlToRenderPath } from '../../utils/urlToRenderPath'
import { validateWithSpec } from '../../utils/validationUtils'
import { LocalParams } from '../../models/Appointments'
import config from '../../config'

const appointmentOutcomes: Route<void> = (req, res, next) => {
  let errorMessages = res?.locals?.errorMessages || {}
  let render = res?.locals?.renderPath || urlToRenderPath(req, res)
  const { crn, id, isInPast, baseOutcomeUrl, reqUrl, appointmentSession } = res.locals.appointmentOutcome
  const { maxCharCount } = config
  const localParams: LocalParams = null

  const validateOutcome = (): void => {
    if (reqUrl !== baseOutcomeUrl) return
    render = 'pages/appointment-outcomes/outcome'
    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req,
        appointmentOutcomesValidation({
          crn,
          id,
          isInPast,
          page: 'outcome/index',
        }),
      ),
    }
  }

  const validateAttendedFailedToComply = (): void => {
    if (!req.url.includes(`${baseOutcomeUrl}/attended-failed-to-comply`)) return
    render = 'pages/appointment-outcomes/attended-failed-to-comply'
    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req,
        appointmentOutcomesValidation({
          crn,
          id,
          page: `outcome/attended-failed-to-comply`,
          msg: 'Select an action for this failure to comply',
          log: 'Attended failed to comply action not selected',
        }),
      ),
    }
  }

  const validateAcceptableAbsence = (): void => {
    if (!req.url.includes(`${baseOutcomeUrl}/acceptable-absence`)) return
    render = 'pages/appointment-outcomes/acceptable-absence'
    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req,
        appointmentOutcomesValidation({
          crn,
          id,
          page: `outcome/acceptable-absence`,
          msg: 'Select why their absence was acceptable',
          log: 'Acceptable absence enforcement action not selected',
        }),
      ),
    }
  }

  const validateUnacceptableAbsence = (): void => {
    if (!req.url.includes(`${baseOutcomeUrl}/unacceptable-absence`)) return
    render = 'pages/appointment-outcomes/unacceptable-absence'
    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req,
        appointmentOutcomesValidation({
          crn,
          id,
          page: `outcome/acceptable-absence`,
          msg: 'Select an action for their unacceptable absence',
          log: 'Unacceptable absence enforcement action not selected',
        }),
      ),
    }
  }

  const validateFailedToAttend = (): void => {
    if (!req.url.includes(`${baseOutcomeUrl}/failed-to-attend`)) return
    render = 'pages/appointment-outcomes/failed-to-attend'
    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req,
        appointmentOutcomesValidation({
          crn,
          id,
          page: `outcome/failed-to-attend`,
          msg: 'Select an enforcement action for their absence',
          log: 'Failed to attend enforcement action not selected',
        }),
      ),
    }
  }

  const validateEnforcementAction = (): void => {
    if (!req.url.includes(`${baseOutcomeUrl}/enforcement-action`)) return
    render = 'pages/appointment-outcomes/enforcement-action'
    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req,
        appointmentOutcomesValidation({
          crn,
          id,
          page: `outcome/enforcement-action`,
          msg: 'Select an enforcement action for their failure to comply',
          log: 'Enforcement action not selected',
        }),
      ),
    }
  }

  const validateInitiateBreachRecall = (): void => {
    if (!req.url.includes(`${baseOutcomeUrl}/initiate-breach-or-recall`)) return
    render = 'pages/appointment-outcomes/initiate-breach-or-recall'
    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req,
        appointmentOutcomesValidation({
          crn,
          id,
          page: `outcome/initiate-breach-or-recall`,
          msg: [
            'Select who will create the breach NSI',
            'Select who will send the letter',
            'Select the type of letter',
          ],
          log: ['breach NSI created by not selected', 'letter sent by no selected', 'letter type not selected'],
          sendLetter: appointmentSession.outcome.enforcementAction === 'INITIATE_BREACH_RECALL_AND_SEND_LETTER',
        }),
      ),
    }
  }

  const validateSendLetter = (): void => {
    if (!req.url.includes(`${baseOutcomeUrl}/send-letter`)) return
    render = 'pages/appointment-outcomes/send-letter'
    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req,
        appointmentOutcomesValidation({
          crn,
          id,
          page: `outcome/send-letter`,
          msg: ['Select who will send the letter', 'Select the type of letter'],
          log: ['letter sent by no selected', 'letter type not selected'],
        }),
      ),
    }
  }

  const validateAddNote = (): void => {
    if (!reqUrl.includes(`${baseOutcomeUrl}/add-note`)) return
    render = 'pages/appointment-outcomes/add-note'
    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req,
        appointmentOutcomesValidation({
          crn,
          id,
          page: `outcome/add-note`,
          notes: req.body.appointments[crn][id].notes,
          maxCharCount: maxCharCount as number,
        }),
      ),
    }
  }

  validateOutcome()
  validateAttendedFailedToComply()
  validateAcceptableAbsence()
  validateUnacceptableAbsence()
  validateFailedToAttend()
  validateEnforcementAction()
  validateInitiateBreachRecall()
  validateSendLetter()
  validateAddNote()

  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    return res.render(render, { errorMessages, ...(localParams ?? {}) })
  }
  return next()
}

export default appointmentOutcomes
