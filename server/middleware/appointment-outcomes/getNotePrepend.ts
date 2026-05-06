import { Route } from '../../@types'
import { EnforcementActionCreatedBy } from '../../models/Appointments'
import { letterTypeOptions } from '../../properties/appointment-outcomes'

export const getNotePrepend: Route<void> = (_req, res, next) => {
  const {
    sentence: { type },
    appointmentSession: {
      outcome: { letterType: _letterType, letterSentBy: _letterSentBy, breachNSICreatedBy: _breachNSICreatedBy },
    },
  } = res.locals.appointmentOutcome
  let breachNSICreatedBy: string
  let letterSentBy: string
  let letterType: string
  let text: string = null

  const getUser = (user: EnforcementActionCreatedBy) => (user === 'CASE_ADMIN' ? 'Case administrator' : 'I')

  if (_breachNSICreatedBy) {
    const breachOrRecall = type === 'COMMUNITY' ? 'breach' : 'recall'
    breachNSICreatedBy = getUser(_breachNSICreatedBy)
    text = `${breachNSICreatedBy} will initiate the ${breachOrRecall}`
  }
  if (_letterSentBy) {
    letterSentBy = getUser(_letterSentBy)
    letterType = letterTypeOptions.find(option => option.value === _letterType).text
    text = `${letterSentBy} will send a ${letterType.toLowerCase()}`
  }
  res.locals.appointmentOutcome.notePrepend = text
  return next()
}
