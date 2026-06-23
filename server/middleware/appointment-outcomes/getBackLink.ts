import { Route } from '../../@types'
import {
  AppointmentEnforcementAction,
  AppointmentOutcomeType,
  AppointmentSessionOutcome,
} from '../../models/Appointments'
import { getDataValue } from '../../utils'

export const getBackLink: Route<void> = (req, res, next) => {
  const { baseOutcomeUrl, reqUrl, uuid, baseUrl, crn, id } = res.locals.appointmentOutcome
  let backLink = baseOutcomeUrl
  if ([baseOutcomeUrl, `${baseOutcomeUrl}/update-enforcement-action`].includes(reqUrl)) {
    backLink = uuid ? `${baseUrl}/location-date-time` : `${baseUrl}/manage`
  }
  let outcomeType: AppointmentOutcomeType
  let otherEnforcementAction: AppointmentEnforcementAction
  if (req?.body?.appointments?.[crn]?.[id]?.outcome?.outcomeType) {
    outcomeType = req.body.appointments[crn][id].outcome.outcomeType
    otherEnforcementAction = req.body.appointments[crn][id].outcome.otherEnforcementAction
  } else {
    const outcome = getDataValue<AppointmentSessionOutcome>(req.session.data, ['appointments', crn, id, 'outcome'])
    if (outcome) {
      outcomeType = outcome?.outcomeType || null
      otherEnforcementAction = outcome?.otherEnforcementAction || null
    }
  }
  if (
    [
      `${baseOutcomeUrl}/enforcement-action`,
      `${baseOutcomeUrl}/send-letter`,
      `${baseOutcomeUrl}/initiate-breach-or-recall`,
    ].some(route => route === reqUrl) &&
    outcomeType
  ) {
    switch (outcomeType) {
      case 'ATTENDED_SENT_HOME_BEHAVIOUR':
      case 'ATTENDED_FAILED_TO_COMPLY':
      case 'ATTENDED_SENT_HOME_SERVICE_ISSUES':
        backLink = `${baseOutcomeUrl}/attended-failed-to-comply` // used for all 3 pages
        break
      case 'UNACCEPTABLE_ABSENCE':
        backLink = `${baseOutcomeUrl}/unacceptable-absence` // used for all 3 pages
        break
      case 'FAILED_TO_ATTEND':
        backLink = `${baseOutcomeUrl}/failed-to-attend` // <-- only used for EVIDENCE_REQUESTED type
        break
      default:
        backLink = `/case/${crn}/appointments/appointment/${id}/manage`
    }
    if (otherEnforcementAction) {
      backLink = `${baseOutcomeUrl}/enforcement-action`
    }
  }
  res.locals.appointmentOutcome.backLink = backLink
  return next()
}
