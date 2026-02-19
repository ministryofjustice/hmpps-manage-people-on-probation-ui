import type { NextFunction, Request } from 'express'
import MasApiClient from '../data/masApiClient'
import { type Services } from '../services'
import { asyncMiddleware } from './asyncMiddleware'
import { type AppResponse } from '../models/Locals'
import { isValidCrn } from '../utils'
import { renderError } from './renderError'

export const limitedAccess = (services: Services) => {
  return asyncMiddleware(async (req: Request, res: AppResponse, next: NextFunction): Promise<void> => {
    const { crn } = req.params as Record<string, string>
    if (!isValidCrn(crn)) {
      return renderError(404)(req, res)
    }
    const token = await services.hmppsAuthClient.getSystemClientToken()
    const access = await new MasApiClient(token).getUserAccess(res.locals.user.username as string, crn)
    if (access.userExcluded || access.userRestricted) {
      const { backLink } = req.session
      if (access.exclusionMessage) {
        return res.render('autherror-lao', { message: access.exclusionMessage, backLink })
      }
      if (access.restrictionMessage) {
        return res.render('autherror-lao', { message: access.restrictionMessage, backLink })
      }
      return res.render('autherror-lao', {
        message: 'You are not authorised to view this case.',
        backLink,
      })
    }
    return next()
  })
}
