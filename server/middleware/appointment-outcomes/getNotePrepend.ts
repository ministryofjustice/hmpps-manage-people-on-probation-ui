import { Route } from '../../@types'
import {
  EnforcementActionCreatedBy,
  otherEnforcementActionLetterTypes,
  type OtherEnforcementActionsLetterType,
} from '../../models/Appointments'
import { letterTypeOptions } from '../../properties/appointment-outcomes'
import logger from '../../../logger'

export const getNotePrepend: Route<void> = (req, res, next) => {
  if (res?.locals?.appointmentOutcome?.appointmentSession?.outcome) {
    const {
      crn,
      id,
      sentence: { type },
      appointmentSession: {
        outcome: {
          letterType: _letterType,
          letterSentBy: _letterSentBy,
          breachNSICreatedBy: _breachNSICreatedBy,
          otherEnforcementAction,
        },
      },
    } = res.locals.appointmentOutcome
    let breachNSICreatedBy: string
    let letterSentBy: string
    let letterType: string
    let text: string[] = []
    const getUser = (user: EnforcementActionCreatedBy) => (user === 'CASE_ADMIN' ? 'Case administrator' : 'I')
    if (_breachNSICreatedBy) {
      const breachOrRecall = type === 'COMMUNITY' ? 'breach' : 'recall'
      breachNSICreatedBy = getUser(_breachNSICreatedBy)
      text = [`${breachNSICreatedBy} will initiate the ${breachOrRecall}`]
    }
    const selectedLetterType =
      otherEnforcementAction &&
      otherEnforcementActionLetterTypes.includes(otherEnforcementAction as OtherEnforcementActionsLetterType)
        ? otherEnforcementAction
        : _letterType

    if (_letterSentBy && selectedLetterType) {
      letterSentBy = getUser(_letterSentBy)
      letterType = letterTypeOptions.find(option => option.value === selectedLetterType)?.text
      if (!letterType) throw new Error(`Letter type not found for value: ${selectedLetterType}`)
      const beginsWithA = letterType.toLowerCase().split(' ').at(0) === 'a'
      text.push(`${letterSentBy} will send${!beginsWithA ? ' a ' : ' '}${letterType.toLowerCase()}`)
    }
    res.locals.appointmentOutcome.notePrepend = text.length ? text.join('\n') : null
    if (res.locals.flags?.enableSessionCacheLogging) {
      logger.debug(
        {
          event: 'notePrepend',
          source: 'getNotePrepend',
          uuid: id,
          crn,
          username: res.locals.user?.username,
          reqMethod: req.method,
          sessionLetterType: _letterType,
          sessionLetterSentBy: _letterSentBy,
          sessionEnforcementActionChoice: otherEnforcementAction,
          resolvedLetterType: selectedLetterType,
          notePrependSet: text.length > 0,
        },
        '[notePrepend] computed',
      )
    }
  }
  return next()
}
