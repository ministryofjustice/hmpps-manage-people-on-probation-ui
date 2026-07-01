import { Request, Response, NextFunction } from 'express'
import { enforcementActionPageKeys } from '../../models/Appointments'
import { setDataValue } from '../../utils'

export const changeActionsReset = (req: Request, res: Response, next: NextFunction) => {
  const { change } = req.query
  const { data } = req.session
  const { crn, id, sendBreachOrRecallLetter, reqUrl } = res.locals.appointmentOutcome
  const enforcementActionPages = [
    'attended-failed-to-comply',
    'unacceptable-absence',
    'failed-to-attend',
    'enforcement-action',
    'update-enforcement-action',
  ]
  if (
    (change && !sendBreachOrRecallLetter && enforcementActionPages.some(url => reqUrl.includes(url))) ||
    (!change && reqUrl.includes('update-enforcement-action'))
  ) {
    setDataValue(data, ['appointments', crn, id, 'outcome', 'enforcementActionCode'], [])
    enforcementActionPageKeys.forEach(key => {
      setDataValue(data, ['appointments', crn, id, 'outcome', key], null)
    })
  }
  return next()
}
