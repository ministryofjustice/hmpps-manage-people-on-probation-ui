import { Request, Response, NextFunction } from 'express'
import { setDataValue } from '../../utils'

export const resetEnforcementActionSelection = (req: Request, res: Response, next: NextFunction) => {
  const { data } = req.session
  const { crn, id, sendBreachOrRecallLetter, reqUrl } = res.locals.appointmentOutcome
  const enforcementActionPages = [
    '/attended-failed-to-comply',
    '/unacceptable-absence',
    '/failed-to-attend',
    '/enforcement-action',
    '/update-enforcement-action',
  ]
  // when posting an action page, reset previous selections if not initiate breach/recall -> send a letter journey
  if (!sendBreachOrRecallLetter && enforcementActionPages.some(url => reqUrl.includes(url))) {
    setDataValue(data, ['appointments', crn, id, 'outcome', 'enforcementActionCode'], [])
    setDataValue(data, ['appointments', crn, id, 'outcome', 'letterType'], null)
    setDataValue(data, ['appointments', crn, id, 'outcome', 'letterSentBy'], null)
    setDataValue(data, ['appointments', crn, id, 'outcome', 'breachNSICreatedBy'], null)
  }
  return next()
}
