import { getConfig } from '../config'
import type { Route } from '../types/Route'

export const sentryMiddleware = (): Route<void | null> => {
  // Pass-through Sentry config into locals, for use in the Sentry loader script (see layout.njk)
  return (_req, res, next) => {
    const config = getConfig()
    res.locals.sentry = config.sentry
    if (next) {
      return next()
    }
    return null
  }
}
