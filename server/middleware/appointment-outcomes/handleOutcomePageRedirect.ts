import { Route } from '../../@types'
import {
  EnforcementActionPage,
  AppointmentEnforcementAction,
  OutcomePage,
  otherEnforcementActionLetterTypes,
  OtherEnforcementActionsLetterType,
} from '../../models/Appointments'
import { findUncompleted } from '../findUncompleted'

type EnforcementRedirectMap = {
  [K in AppointmentEnforcementAction]?: string
}

export const handleOutcomePageRedirect = (pageKey: EnforcementActionPage | OutcomePage): Route<void> => {
  return function handleOutcomePageRedirectInner(req, res) {
    const { baseOutcomeUrl, appointmentSession } = res.locals.appointmentOutcome
    const { change: _change } = req.query as Record<string, string>
    const change = _change ? decodeURIComponent(_change) : undefined
    const enforcementAction = appointmentSession?.outcome?.[pageKey] as AppointmentEnforcementAction
    const redirectMap: EnforcementRedirectMap = {
      SEND_LETTER: `${baseOutcomeUrl}/send-letter`,
      SEND_ANOTHER_LETTER: `${baseOutcomeUrl}/send-letter`,
      BREACH_RECALL_INITIATED: `${baseOutcomeUrl}/initiate-breach-or-recall`,
      BREACH_RECALL_INITIATED_AND_SEND_LETTER: `${baseOutcomeUrl}/initiate-breach-or-recall`,
      DIFFERENT_ACTION: `${baseOutcomeUrl}/enforcement-action`,
    }

    let redirect = redirectMap?.[enforcementAction]
    if (
      pageKey === 'otherEnforcementAction' &&
      otherEnforcementActionLetterTypes.includes(enforcementAction as OtherEnforcementActionsLetterType)
    ) {
      redirect = `${baseOutcomeUrl}/send-letter`
    }
    if (redirect) {
      redirect = `${redirect}${change ? `?change=${encodeURIComponent(change)}` : ''}`
    } else if (change) {
      redirect = change.includes('/outcome') ? change : findUncompleted()(req, res)
    } else {
      redirect = `${baseOutcomeUrl}/add-note`
    }
    return res.redirect(redirect)
  }
}
