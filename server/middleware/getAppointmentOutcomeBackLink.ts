import { Route } from '../@types'
import { AppointmentOutcomeType } from '../models/Appointments'
import { getDataValue } from '../utils'

export const getAppointmentOutcomeBackLink: Route<void> = (req, res, next) => {
  const { baseUrl, reqUrl, uuid, crn, id } = res.locals.appointmentOutcome
  let backLink = baseUrl
  if (reqUrl === baseUrl) {
    backLink = uuid
      ? `/case/${crn}/arrange-appointment/${id}/location-date-time`
      : `/case/${crn}/appointments/appointment/${id}/manage`
  }
  let type: AppointmentOutcomeType
  if (req?.body?.appointments?.[crn]?.[id]?.outcome?.type) {
    type = req.body.appointments[crn][id].outcome.type
  } else {
    type = req?.session?.data
      ? getDataValue<AppointmentOutcomeType>(req.session.data, ['appointments', crn, id, 'outcome', 'type'])
      : null
  }
  if (
    [`${baseUrl}/enforcement-action`, `${baseUrl}/send-letter`, `${baseUrl}/initiate-breach-or-recall`].some(
      route => route === reqUrl,
    )
  ) {
    switch (type) {
      case 'ATTENDED_SENT_HOME_BEHAVIOUR':
      case 'ATTENDED_FAILED_TO_COMPLY':
      case 'ATTENDED_SENT_HOME_SERVICE_ISSUES':
        backLink = `${baseUrl}/attended-failed-to-comply` // used for all 3 pages
        break
      case 'UNACCEPTABLE_ABSENCE':
        backLink = `${baseUrl}/unacceptable-absence` // used for all 3 pages
        break
      default:
        backLink = `${baseUrl}/failed-to-attend` // <-- only used for EVIDENCE_REQUESTED type
    }
  }
  res.locals.appointmentOutcome.backLink = backLink
  return next()
}
