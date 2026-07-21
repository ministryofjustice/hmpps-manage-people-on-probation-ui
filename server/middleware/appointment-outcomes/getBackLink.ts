import { Route } from '../../@types'

export const getBackLink: Route<void> = (req, res, next) => {
  const { baseOutcomeUrl, reqUrl, uuid, baseUrl, sendLetter, appointmentSession } = res.locals.appointmentOutcome
  let backLink = null
  const { back } = req.query as Record<string, string>

  const attendedFailedToComply = appointmentSession?.outcome?.attendedFailedToComply
  const acceptableAbsence = appointmentSession?.outcome?.acceptableAbsence
  const unacceptableAbsence = appointmentSession?.outcome?.unacceptableAbsence
  const failedToAttend = appointmentSession?.outcome?.failedToAttend
  const breachNSICreatedBy = appointmentSession?.outcome?.breachNSICreatedBy
  const redirectFromUpdate = appointmentSession?.outcome?.redirectFromUpdate
  const otherEnforcementAction = appointmentSession?.outcome?.otherEnforcementAction
  const updateEnforcementAction = appointmentSession?.outcome?.updateEnforcementAction
  const outcomeType = appointmentSession?.outcome?.outcomeType

  if ([baseOutcomeUrl, `${baseOutcomeUrl}/update-enforcement-action`].includes(reqUrl)) {
    backLink = uuid ? `${baseUrl}/location-date-time` : `${baseUrl}/manage`
  }

  // other enforcement action 👇

  if (reqUrl === `${baseOutcomeUrl}/enforcement-action`) {
    if (updateEnforcementAction) {
      backLink = `${baseOutcomeUrl}/update-enforcement-action`
    } else if (redirectFromUpdate) {
      backLink = `${baseUrl}/manage`
    } else if (attendedFailedToComply === 'DIFFERENT_ACTION') {
      backLink = `${baseOutcomeUrl}/attended-failed-to-comply`
    } else if (unacceptableAbsence === 'DIFFERENT_ACTION') {
      backLink = `${baseOutcomeUrl}/unacceptable-absence`
    } else if (failedToAttend === 'DIFFERENT_ACTION') {
      backLink = `${baseOutcomeUrl}/failed-to-attend`
    }
  }

  // send letter 👇

  if (reqUrl === `${baseOutcomeUrl}/send-letter`) {
    if (otherEnforcementAction) {
      backLink = `${baseOutcomeUrl}/enforcement-action`
    } else if (updateEnforcementAction) {
      backLink = `${baseOutcomeUrl}/update-enforcement-action`
    } else if (attendedFailedToComply) {
      backLink = `${baseOutcomeUrl}/attended-failed-to-comply`
    } else if (unacceptableAbsence) {
      backLink = `${baseOutcomeUrl}/unacceptable-absence`
    } else if (failedToAttend) {
      backLink = `${baseOutcomeUrl}/failed-to-attend`
    }
  }

  // initiate breach or recall 👇

  if (reqUrl === `${baseOutcomeUrl}/initiate-breach-or-recall`) {
    if (otherEnforcementAction) {
      backLink = `${baseOutcomeUrl}/enforcement-action`
    } else if (updateEnforcementAction) {
      backLink = `${baseOutcomeUrl}/update-enforcement-action`
    } else if (attendedFailedToComply) {
      backLink = `${baseOutcomeUrl}/attended-failed-to-comply`
    } else if (unacceptableAbsence) {
      backLink = `${baseOutcomeUrl}/unacceptable-absence`
    }
  }

  // add note 👇

  if (reqUrl === `${baseOutcomeUrl}/add-note`) {
    if (sendLetter) {
      backLink = `${baseOutcomeUrl}/send-letter`
    } else if (breachNSICreatedBy) {
      backLink = `${baseOutcomeUrl}/initiate-breach-or-recall`
    } else if (otherEnforcementAction) {
      backLink = `${baseOutcomeUrl}/enforcement-action`
    } else if (updateEnforcementAction) {
      backLink = `${baseOutcomeUrl}/update-enforcement-action`
    } else if (attendedFailedToComply) {
      backLink = `${baseOutcomeUrl}/attended-failed-to-comply`
    } else if (acceptableAbsence) {
      backLink = `${baseOutcomeUrl}/acceptable-absence`
    } else if (unacceptableAbsence) {
      backLink = `${baseOutcomeUrl}/unacceptable-absence`
    } else if (failedToAttend) {
      backLink = `${baseOutcomeUrl}/failed-to-attend`
    } else if (['ATTENDED_COMPLED', 'ATTENDED_SENT_HOME_SERVICE_ISSUES'].includes(outcomeType)) {
      backLink = baseOutcomeUrl
    }
  }
  if (back) {
    backLink = back
  }
  if (!backLink) {
    backLink = baseOutcomeUrl
  }

  res.locals.appointmentOutcome.backLink = backLink
  return next()
}
