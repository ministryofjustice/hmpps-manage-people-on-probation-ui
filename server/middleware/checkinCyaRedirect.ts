import { NextFunction, Request, Response } from 'express'
import { Route } from '../@types'

export const postRedirectWizard = (): Route<Promise<void>> => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { crn, id } = req.params as Record<string, string>
    const redirectUrl = `/case/${crn}/appointments/${id}/check-in/checkin-summary`
    const skipContactPrefTypes = ['mobile', 'emailAddress']
    if (req.query.cya === 'true') {
      if (skipContactPrefTypes.includes(req.body.change)) {
        return next()
      }
      return res.redirect(redirectUrl)
    }
    return next()
  }
}
