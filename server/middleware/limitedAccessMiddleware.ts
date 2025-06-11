import type { NextFunction, Request } from 'express'
import MasApiClient from '../data/masApiClient'
import { Services } from '../services'
import asyncMiddleware from './asyncMiddleware'
import { AppResponse } from '../models/Locals'

export default function limitedAccess(services: Services) {
  return asyncMiddleware(async (req: Request, res: AppResponse, next: NextFunction): Promise<void> => {
    const token = await services.hmppsAuthClient.getSystemClientToken()
    const access = await new MasApiClient(token).getUserAccess(res.locals.user.username, req.params.crn)

    if (access.userExcluded || access.userRestricted) {
      const { backLink } = req.session
      if (access.exclusionMessage) {
        res.render('autherror-lao', { message: access.exclusionMessage, backLink })
      } else if (access.restrictionMessage) {
        res.render('autherror-lao', { message: access.restrictionMessage, backLink })
      } else {
        res.render('autherror-lao', {
          message: 'You are not authorised to view this case.',
          backLink,
        })
      }
      return
    }
    next()
  })
}
