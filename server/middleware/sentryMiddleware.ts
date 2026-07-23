import config from '../config'
import type { Route } from '../@types'

export default function sentryMiddleware(): Route<void> {
  // Pass-through Sentry config into locals, for use in the Sentry loader script (see layout.njk)
  return function sentryMiddlewareInner(req, res, next) {
    res.locals.sentry = config.sentry
    return next()
  }
}
