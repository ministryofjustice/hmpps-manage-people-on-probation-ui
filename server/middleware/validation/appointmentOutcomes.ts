import { Route } from '../../@types'
import { appointmentOutcomesValidation } from '../../properties'
import { urlToRenderPath } from '../../utils/urlToRenderPath'
import { validateWithSpec } from '../../utils/validationUtils'
import { LocalParams } from '../../models/Appointments'
import { getMinMaxDates } from '../../utils/getMinMaxDates'
import { appointmentDateIsInPast } from '../appointmentDateIsInPast'
import { isRescheduleAppointment } from '../isRescheduleAppointment'

const appointmentOutcomes: Route<void> = (req, res, next) => {
  let errorMessages = res?.locals?.errorMessages || {}
  let render = res?.locals?.renderPath || urlToRenderPath(req, res)
  const { params, body } = req
  const { crn, id: uuid, contactId } = params as Record<string, string>
  const isInPast = appointmentDateIsInPast(req)
  const baseUrl = req.url.split('?')[0]
  const matchUrl = uuid
    ? `/case/${crn}/arrange-appointment/${uuid}`
    : `/case/${crn}/appointments/appointment/${contactId}`
  const id = uuid ?? contactId
  let localParams: LocalParams = {
    crn,
    id,
    body,
  }

  if (req.url.includes('/outcome/attended-complied')) {
    const { _maxDate } = getMinMaxDates()
    localParams = {
      ...localParams,
      isReschedule: isRescheduleAppointment(req),
      isInPast: appointmentDateIsInPast(req),
      _maxDate,
      ...res.locals.attendedCompliedProps,
    }
  }

  const validateOutcome = (): void => {
    if (baseUrl !== `${matchUrl}/outcome`) return
    render = 'pages/appointment-outcomes/outcome'
    localParams = { ...localParams, ...res.locals.attendedCompliedProps }
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
    if (baseUrl !== `/case/${crn}/appointments/appointment/${id}/outcome/attended-complied`) return
    render = 'pages/appointment-outcomes/attended-complied'
    localParams = { ...localParams, ...res.locals.attendedCompliedProps }
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
