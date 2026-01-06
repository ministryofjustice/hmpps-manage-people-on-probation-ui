import { NextFunction, Request, Response } from 'express'
import { Route } from '../@types'

export const redirectWizard = (): Route<Promise<void>> => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { crn, id } = req.params
    if (req.query.cya === 'true') {
      return res.redirect(`/case/${crn}/appointments/${id}/check-in/checkin-summary`)
    }
    return next()
  }
}
