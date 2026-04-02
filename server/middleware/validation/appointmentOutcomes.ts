import { Route } from '../../@types'
import { appointmentOutcomesValidation } from '../../properties'
import { urlToRenderPath } from '../../utils/urlToRenderPath'
import { validateWithSpec } from '../../utils/validationUtils'
import { LocalParams } from '../../models/Appointments'
import { getMinMaxDates } from '../../utils/getMinMaxDates'
import { isRescheduleAppointment } from '../isRescheduleAppointment'
import config from '../../config'

const appointmentOutcomes: Route<void> = (req, res, next) => {
  let errorMessages = res?.locals?.errorMessages || {}
  let render = res?.locals?.renderPath || urlToRenderPath(req, res)
  const { crn, id, isInPast, baseUrl, reqUrl } = res.locals.appointmentOutcome
  const { maxCharCount } = config
  let localParams: LocalParams

  if (req.url.includes(`${baseUrl}/attended-complied`)) {
    const { _maxDate } = getMinMaxDates()
    localParams = {
      ...localParams,
      isReschedule: isRescheduleAppointment(req),
      _maxDate,
    }
  }

  const validateOutcome = (): void => {
    if (reqUrl !== baseUrl) return
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

  const validateAddNote = (): void => {
    if (!baseUrl.includes(`${baseUrl}/add-note`)) return
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

  const validateAttendedComplied = (): void => {
    if (reqUrl !== `${baseUrl}/attended-complied`) return
    render = 'pages/appointment-outcomes/attended-complied'
    errorMessages = validateWithSpec(
      req,
      appointmentOutcomesValidation({
        crn,
        id,
        page: `outcome/attended-complied`,
      }),
    )
  }

  validateOutcome()
  validateAddNote()
  validateAttendedComplied()

  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    return res.render(render, { errorMessages, ...localParams })
  }
  return next()
}

export default appointmentOutcomes
