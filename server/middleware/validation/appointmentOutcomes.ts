import { Route } from '../../@types'
import { appointmentOutcomesValidation } from '../../properties'
import { urlToRenderPath } from '../../utils/urlToRenderPath'
import { validateWithSpec } from '../../utils/validationUtils'
import { LocalParams } from '../../models/Appointments'
import config from '../../config'

const appointmentOutcomes: Route<void> = (req, res, next) => {
  let errorMessages = res?.locals?.errorMessages || {}
  let render = res?.locals?.renderPath || urlToRenderPath(req, res)
  const { crn, id, isInPast, baseOutcomeUrl, reqUrl } = res.locals.appointmentOutcome
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
          log: 'Acceptable absence action not selected',
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
          log: 'Unacceptable absence action not selected',
        }),
      ),
    }
  }

  const validateAddNote = (): void => {
    if (!reqUrl.includes(`${baseOutcomeUrl}/add-note`)) return
    render = 'pages/appointment-outcomes/add-note'
    errorMessages = validateWithSpec(
      req,
      appointmentOutcomesValidation({
        crn,
        id,
        page: `outcome/add-note`,
        notes: req.body.appointments[crn][id].notes,
        maxCharCount: maxCharCount as number,
      }),
    )
  }

  validateOutcome()
  validateAttendedFailedToComply()
  validateAcceptableAbsence()
  validateUnacceptableAbsence()
  validateAddNote()

  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    return res.render(render, { errorMessages, ...(localParams ?? {}) })
  }
  return next()
}

export default appointmentOutcomes
