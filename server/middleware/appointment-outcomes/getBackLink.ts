import { Route } from '../../@types'
import { AppointmentOutcomeType } from '../../models/Appointments'
import { getDataValue } from '../../utils'

export const getBackLink: Route<void> = (req, res, next) => {
  const { baseOutcomeUrl, reqUrl, uuid, baseUrl, crn, id } = res.locals.appointmentOutcome
  let backLink = baseOutcomeUrl
  if (reqUrl === baseOutcomeUrl) {
    backLink = uuid ? `${baseUrl}/location-date-time` : `${baseUrl}/manage`
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
    [
      `${baseOutcomeUrl}/enforcement-action`,
      `${baseOutcomeUrl}/send-letter`,
      `${baseOutcomeUrl}/initiate-breach-or-recall`,
    ].some(route => route === reqUrl)
  ) {
    switch (type) {
      case 'ATTENDED_SENT_HOME_BEHAVIOUR':
      case 'ATTENDED_FAILED_TO_COMPLY':
      case 'ATTENDED_SENT_HOME_SERVICE_ISSUES':
        backLink = `${baseOutcomeUrl}/attended-failed-to-comply` // used for all 3 pages
        break
      case 'UNACCEPTABLE_ABSENCE':
        backLink = `${baseOutcomeUrl}/unacceptable-absence` // used for all 3 pages
        break
      default:
        backLink = `${baseOutcomeUrl}/failed-to-attend` // <-- only used for EVIDENCE_REQUESTED type
    }
  }
  res.locals.appointmentOutcome.backLink = backLink
  return next()
}
