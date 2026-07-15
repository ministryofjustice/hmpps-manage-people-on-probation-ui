import { Request, NextFunction } from 'express'
import { setDataValue } from '../../utils'
import { enforcementActionPageKeys, letterEnforcementActions } from '../../models/Appointments'
import { AppResponse } from '../../models/Locals'
import { logSessionCacheChange } from '../../utils/logSessionCacheChange'
import logger from '../../../logger'

export const resetEnforcementActionSelection = (req: Request, res: AppResponse, next: NextFunction) => {
  const { data } = req.session
  const { crn, id, sendBreachOrRecallLetter, reqUrl, otherAction, baseOutcomeUrl, appointmentSession } =
    res.locals.appointmentOutcome
  const context = {
    uuid: id,
    crn,
    username: res.locals.user?.username,
    enabled: res.locals.flags?.enableSessionCacheLogging,
  }
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
  const updateEnforcementAction = appointmentSession?.outcome?.updateEnforcementAction

  const postedOtherEnforcementAction = req.body?.appointments?.[crn]?.[id]?.outcome?.otherEnforcementAction
  const postedUpdateEnforcementAction = req.body?.appointments?.[crn]?.[id]?.outcome?.updateEnforcementAction
  const nonCompliantActions = [attendedFailedToComply, unacceptableAbsence, failedToAttend, updateEnforcementAction]

  const resetLetterAction = (source: string) => {
    if (letterType) {
      logSessionCacheChange(source, data, ['appointments', crn, id, 'outcome', 'letterType'], null, context)
      delete req.session.data.appointments[crn][id].outcome.letterType
    }
    if (letterSentBy) {
      logSessionCacheChange(source, data, ['appointments', crn, id, 'outcome', 'letterSentBy'], null, context)
      delete req.session.data.appointments[crn][id].outcome.letterSentBy
    }
  }

  if (!nonCompliantActions.includes('SEND_LETTER') && postedAction.includes('SEND_LETTER')) {
    resetLetterAction('resetEnforcementAction:sendLetter')
  }

  if (
    reqUrl === `${baseOutcomeUrl}/enforcement-action` &&
    (letterEnforcementActions.includes(postedOtherEnforcementAction) ||
      letterEnforcementActions.includes(otherEnforcementAction as (typeof letterEnforcementActions)[number])) &&
    otherEnforcementAction !== postedOtherEnforcementAction
  ) {
    resetLetterAction('resetEnforcementAction:enforcementActionChange')
  }

  if (
    !nonCompliantActions.includes('BREACH_RECALL_INITIATED_AND_SEND_LETTER') &&
    postedAction.includes('BREACH_RECALL_INITIATED_AND_SEND_LETTER')
  ) {
    if (letterType) {
      logSessionCacheChange(
        'resetEnforcementAction:breachRecall',
        data,
        ['appointments', crn, id, 'outcome', 'letterType'],
        null,
        context,
      )
      delete req.session.data.appointments[crn][id].outcome.letterType
    }
    if (letterSentBy) {
      logSessionCacheChange(
        'resetEnforcementAction:breachRecall',
        data,
        ['appointments', crn, id, 'outcome', 'letterSentBy'],
        null,
        context,
      )
      delete req.session.data.appointments[crn][id].outcome.letterSentBy
    }
    if (breachNSICreatedBy) {
      logSessionCacheChange(
        'resetEnforcementAction:breachRecall',
        data,
        ['appointments', crn, id, 'outcome', 'breachNSICreatedBy'],
        null,
        context,
      )
      delete req.session.data.appointments[crn][id].outcome.breachNSICreatedBy
    }
  }

  const otherActionDownstreamPages = [
    `${baseOutcomeUrl}/enforcement-action`,
    `${baseOutcomeUrl}/update-enforcement-action`,
  ]

  const skipReset =
    (reqUrl === `${baseOutcomeUrl}/initiate-breach-or-recall` && sendBreachOrRecallLetter) ||
    (otherAction &&
      otherActionDownstreamPages.includes(reqUrl) &&
      (reqUrl !== `${baseOutcomeUrl}/update-enforcement-action` || postedAction.includes('DIFFERENT_ACTION')))

  if (context.enabled) {
    logger.debug(
      {
        event: 'resetEnforcementAction',
        source: 'resetEnforcementAction:preReset',
        uuid: context.uuid,
        crn: context.crn,
        username: context.username,
        reqMethod: req.method,
        reqUrl,
        skipReset,
        otherAction,
        sessionLetterType: letterType,
        sessionLetterSentBy: letterSentBy,
        sessionEnforcementActionChoice: otherEnforcementAction,
        sessionUpdateEnforcementAction: updateEnforcementAction,
        postedEnforcementActionChoice: postedOtherEnforcementAction,
        postedUpdateEnforcementAction,
        enforcementActionCodeLength: appointmentSession?.outcome?.enforcementActionCode?.length ?? 0,
      },
      '[resetEnforcementAction] state before reset',
    )
  }

  if (!skipReset && enforcementActionPages.some(url => reqUrl === url)) {
    logSessionCacheChange(
      'resetEnforcementAction:mainReset',
      data,
      ['appointments', crn, id, 'outcome', 'enforcementActionCode'],
      [],
      context,
    )
    setDataValue(data, ['appointments', crn, id, 'outcome', 'enforcementActionCode'], [])
    enforcementActionPageKeys.forEach(key => {
      if (req?.session?.data?.appointments?.[crn]?.[id]?.outcome?.[key]) {
        logSessionCacheChange(
          'resetEnforcementAction:mainReset',
          data,
          ['appointments', crn, id, 'outcome', key],
          null,
          context,
        )
        delete req.session.data.appointments[crn][id].outcome[key]
      }
    })
  }
  return next()
}
