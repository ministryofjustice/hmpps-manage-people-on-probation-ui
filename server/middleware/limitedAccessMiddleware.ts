import type { NextFunction, Request } from 'express'
import MasApiClient from '../data/masApiClient'
import { Services } from '../services'
import asyncMiddleware from './asyncMiddleware'
import { AppResponse } from '../models/Locals'
import { isValidCrn } from '../utils'
import { renderError } from './renderError'

export default function limitedAccess(services: Services) {
  return asyncMiddleware(async (req: Request, res: AppResponse, next: NextFunction): Promise<void> => {
    if (!isValidCrn(req?.params?.crn)) {
      return renderError(404)(req, res)
    }
    const token = await services.hmppsAuthClient.getSystemClientToken()
    const access = await new MasApiClient(token).getUserAccess(res.locals.user.username, req.params.crn)
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
