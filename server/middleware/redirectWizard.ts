import { Request, Response, NextFunction } from 'express'
import { getDataValue, isValidCrn, isValidUUID } from '../utils'
import { Route } from '../@types'
import { renderError } from './renderError'

export const redirectWizard = (requiredValues: (string | string[])[]): Route<Promise<void>> => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { crn, id } = req.params
    const { data } = req.session
    for (const requiredValue of requiredValues) {
      const path = Array.isArray(requiredValue) ? requiredValue : [requiredValue]
      const repeatAppointmentsEnabled = res?.locals?.flags?.enableRepeatAppointments === true
      const value = getDataValue(data, ['appointments', crn, id, ...path])
      // const logvalue = getDataValue(data, ['appointments', crn, id])
      // console.log(logvalue)
      // console.log(requiredValue)
      // console.log(value)
      const makeRedirect =
        (repeatAppointmentsEnabled && requiredValue === 'repeating' && !value) ||
        (requiredValue !== 'repeating' && !value)
      if (makeRedirect) {
        if (!isValidCrn(crn) || !isValidUUID(id)) {
          return renderError(404)(req, res)
        }
        return res.redirect(`/case/${crn}/arrange-appointment/${id}/sentence`)
      }
    }
    return next()
  }
}
