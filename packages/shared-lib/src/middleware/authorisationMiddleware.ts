import { jwtDecode } from 'jwt-decode'
import type { RequestHandler, Request, NextFunction } from 'express'

import logger from '../logger'
import { asyncMiddleware } from './asyncMiddleware'
import { AppResponse } from '../models/Locals'

export const authorisationMiddleware = (allowedRoles: string[] = []): RequestHandler => {
  return asyncMiddleware((req: Request, res: AppResponse, next: NextFunction) => {
    const allowedAuthorities = allowedRoles.map(role => (role.startsWith('ROLE_') ? role : `ROLE_${role}`))
    if (res.locals?.user?.token) {
      const { authorities = [], auth_source: authSource } = jwtDecode(res.locals.user.token) as {
        authorities?: string[]
        auth_source?: string
      }

      if (
        authSource !== 'delius' ||
        (allowedAuthorities.length && !authorities.some(authority => allowedAuthorities.includes(authority)))
      ) {
        logger.error('User is not authorised to access this')
        return res.redirect('/authError')
      }
      return next()
    }

    req.session.returnTo = req.originalUrl
    return res.redirect('/sign-in')
  })
}
