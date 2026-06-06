import { Route } from '../../@types'
import { SentenceCompliance } from '../../data/model/compliance'
import { BreachOrRecallWarning, WarningType } from '../../models/Locals'
import { dateWithYear } from '../../utils'

export const getBreachOrRecallWarning = (): Route<void> => {
  return (_req, res, next) => {
    const { sentence } = res.locals.appointmentOutcome
    let breachOrRecallWarning: BreachOrRecallWarning | null = null
    if (sentence?.eventId) {
      const warningTypeKey: keyof SentenceCompliance = sentence.type === 'COMMUNITY' ? 'activeBreach' : 'activeRecall'
      if (sentence?.order && sentence?.[warningTypeKey]?.startDate) {
        const warningType = warningTypeKey.replace('active', '').toUpperCase() as WarningType
        breachOrRecallWarning = {
          title: `There is a live ${warningType.toLowerCase()} for this sentence`,
          text: `The ${warningType.toLowerCase()} for ${sentence.order.toLowerCase()} was initiated on ${dateWithYear(sentence[warningTypeKey].startDate)}.`,
          type: warningType,
        }
      }
    }
    res.locals.appointmentOutcome.breachOrRecallWarning = breachOrRecallWarning
    return next()
  }
}
