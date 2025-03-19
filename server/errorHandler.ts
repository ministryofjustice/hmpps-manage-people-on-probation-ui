import type { Request, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import logger from '../logger'
import type { AppResponse } from './@types'
import { statusErrors, type StatusErrorCode } from './properties'

export default function createErrorHandler(production: boolean) {
  return (error: HTTPError, req: Request, res: AppResponse, _next: NextFunction): void => {
    const { status } = error
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)
    const { title, message } =
      statusErrors[statusErrors?.[status as StatusErrorCode] ? (status as StatusErrorCode) : 500]

    if (status === 401 || status === 403) {
      logger.info('Logging user out')
      return res.redirect('/sign-out')
    }
    res.locals.title = title
    res.locals.message = production ? message : `${message}<p>Error: ${error.status} ${error.message}</p>`
    res.locals.status = status
    res.locals.stack = production ? null : error.stack

    res.status(error?.status || 500)

    return res.render('pages/error')
  }
}
