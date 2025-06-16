import { Request, Response, NextFunction } from 'express'
import { getDataValue, isValidCrn, isValidUUID } from '../utils'
import { Route } from '../@types'
import { renderError } from './renderError'

export const redirectWizard = (requiredValues: string[] | string[][]): Route<Promise<void>> => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { crn, id } = req.params
    const { data } = req.session
    for (const requiredValue of requiredValues) {
      const value = getDataValue(data, ['appointments', crn, id, requiredValue])
      if (!value) {
        if (!isValidCrn(crn) || !isValidUUID(id)) {
          return renderError(404)(req, res)
        }
        return res.redirect(`/case/${crn}/arrange-appointment/${id}/type`)
      }
    }
    return next()
  }
}
