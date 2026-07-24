import type { Request, NextFunction } from 'express'
import * as Sentry from '@sentry/node'
import type { HTTPError } from 'superagent'
import logger from '../logger'
import { statusErrors, type StatusErrorCode } from './properties'
import { AppResponse } from './models/Locals'
import isTimeoutError from './utils/isTimeoutError'

export default function createErrorHandler(production: boolean) {
  return function createErrorHandlerInner(error: HTTPError, req: Request, res: AppResponse, _next: NextFunction): void {
    const { status } = error
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    if (isTimeoutError(error) && Sentry.getClient()) {
      const eventId = Sentry.captureException(error, {
        tags: {
          'error.kind': 'timeout',
          'request.path': req.originalUrl,
          'user.username': res.locals.user?.username ?? 'unknown',
        },
      })

      logger.info(`Sentry timeout eventId: ${eventId}`)
    }

    const { title, message } =
      statusErrors[statusErrors?.[status as StatusErrorCode] ? (status as StatusErrorCode) : 500]

    if (status === 401 || status === 403) {
      logger.info('Logging user out')
      return res.redirect('/sign-out')
    }
    res.locals.title = title
    res.locals.message = production ? message : `${message}<pre>${error.stack}</pre>`
    res.locals.status = status
    res.locals.stack = production ? null : error.stack

    res.status(error?.status ?? 500)

    return res.render('pages/error')
  }
}
