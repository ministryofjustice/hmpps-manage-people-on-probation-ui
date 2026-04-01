import { Route } from '../../@types'
import { appointmentOutcomesValidation } from '../../properties'
import { urlToRenderPath } from '../../utils/urlToRenderPath'
import { validateWithSpec } from '../../utils/validationUtils'
import { LocalParams } from '../../models/Appointments'
import { getMinMaxDates } from '../../utils/getMinMaxDates'
import { isRescheduleAppointment } from '../isRescheduleAppointment'

const appointmentOutcomes: Route<void> = (req, res, next) => {
  let errorMessages = res?.locals?.errorMessages || {}
  let render = res?.locals?.renderPath || urlToRenderPath(req, res)
  const { crn, id, isInPast, baseUrl, reqUrl } = res.locals.appointmentOutcome

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

  const validateAttendedComplied = (): void => {
    if (reqUrl !== `${baseUrl}/attended-complied`) return
    render = 'pages/appointment-outcomes/attended-complied'
    errorMessages = validateWithSpec(
      req,
      appointmentOutcomesValidation({
        crn,
        id,
        page: `arrange-appointment/${id}/outcome/attended-complied`,
      }),
    )
  }

  validateOutcome()
  validateAttendedComplied()

  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    return res.render(render, { errorMessages, ...localParams })
  }
  return next()
}

export default appointmentOutcomes
