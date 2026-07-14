import { Request, NextFunction } from 'express'
import { setDataValue } from '../../utils'
import { enforcementActionPageKeys, letterEnforcementActions } from '../../models/Appointments'
import { AppResponse } from '../../models/Locals'

export const resetEnforcementActionSelection = (req: Request, res: AppResponse, next: NextFunction) => {
  const { data } = req.session
  const { crn, id, sendBreachOrRecallLetter, reqUrl, otherAction, baseOutcomeUrl, appointmentSession } =
    res.locals.appointmentOutcome
  const enforcementActionPages = [
    baseOutcomeUrl,
    `${baseOutcomeUrl}/attended-failed-to-comply`,
    `${baseOutcomeUrl}/acceptable-absence`,
    `${baseOutcomeUrl}/unacceptable-absence`,
    `${baseOutcomeUrl}/failed-to-attend`,
    `${baseOutcomeUrl}/enforcement-action`,
    `${baseOutcomeUrl}/update-enforcement-action`,
  ]

  const postedAction = JSON.stringify(Object.values(req.body).flat())

  const attendedFailedToComply = appointmentSession?.outcome?.attendedFailedToComply
  const unacceptableAbsence = appointmentSession?.outcome?.unacceptableAbsence
  const failedToAttend = appointmentSession?.outcome?.failedToAttend
  const letterType = appointmentSession?.outcome?.letterType
  const letterSentBy = appointmentSession?.outcome?.letterSentBy
  const breachNSICreatedBy = appointmentSession?.outcome?.breachNSICreatedBy
  const otherEnforcementAction = appointmentSession?.outcome?.otherEnforcementAction

  const postedOtherEnforcementAction = req.body?.appointments?.[crn]?.[id]?.outcome?.otherEnforcementAction
  const nonCompliantActions = [attendedFailedToComply, unacceptableAbsence, failedToAttend]

  const resetLetterAction = () => {
    if (letterType) {
      delete req.session.data.appointments[crn][id].outcome.letterType
    }
    if (letterSentBy) {
      delete req.session.data.appointments[crn][id].outcome.letterSentBy
    }
  }

  if (!nonCompliantActions.includes('SEND_LETTER') && postedAction.includes('SEND_LETTER')) {
    resetLetterAction()
  }

  if (
    reqUrl === `${baseOutcomeUrl}/enforcement-action` &&
    (letterEnforcementActions.includes(postedOtherEnforcementAction) ||
      letterEnforcementActions.includes(otherEnforcementAction as (typeof letterEnforcementActions)[number])) &&
    otherEnforcementAction !== postedOtherEnforcementAction
  ) {
    resetLetterAction()
  }

  if (
    !nonCompliantActions.includes('BREACH_RECALL_INITIATED_AND_SEND_LETTER') &&
    postedAction.includes('BREACH_RECALL_INITIATED_AND_SEND_LETTER')
  ) {
    if (letterType) {
      delete req.session.data.appointments[crn][id].outcome.letterType
    }
    if (letterSentBy) {
      delete req.session.data.appointments[crn][id].outcome.letterSentBy
    }
    if (breachNSICreatedBy) {
      delete req.session.data.appointments[crn][id].outcome.breachNSICreatedBy
    }
  }

  const otherActionDownstreamPages = [
    `${baseOutcomeUrl}/enforcement-action`,
    `${baseOutcomeUrl}/update-enforcement-action`,
  ]

  const skipReset =
    (reqUrl === `${baseOutcomeUrl}/initiate-breach-or-recall` && sendBreachOrRecallLetter) ||
    (otherAction && otherActionDownstreamPages.includes(reqUrl))

  if (!skipReset && enforcementActionPages.some(url => reqUrl === url)) {
    setDataValue(data, ['appointments', crn, id, 'outcome', 'enforcementActionCode'], [])
    enforcementActionPageKeys.forEach(key => {
      if (req?.session?.data?.appointments?.[crn]?.[id]?.outcome?.[key]) {
        delete req.session.data.appointments[crn][id].outcome[key]
      }
    })
  }
  return next()
}
