import { type RequestHandler } from 'express'
import logger from '../../logger'

/**
 * High-level access-log style middleware. Logs one line when a request comes
 * in, and one line when the response finishes - covering method, path, matched
 * route pattern, status, duration, and the full list of handlers (middleware
 * and controller) that actually ran for that request. This makes every route
 * hit (get/post/all) and its handler chain visible without manually
 * instrumenting individual middleware or controllers.
 *
 * The handler chain comes from `req.handlerTrace`, populated by
 * `instrumentRouter()` (see instrumentRouter.ts), which wraps every handler
 * registered on Router at registration time. This is necessary because many
 * routes in this app split registrations across multiple calls for the same
 * path, e.g:
 *   router.all('/case/:crn/thing', mwAll1, mwAll2)
 *   router.get('/case/:crn/thing', mwGet1, controller)
 * Express's own `req.route.stack` only reflects the LAST matched Route
 * object (router.get here), silently omitting mwAll1/mwAll2 even though they
 * ran - `req.handlerTrace` captures the true, full, chronological chain
 * across all such registrations instead.
 *
 * Many handlers - middleware and controllers alike - are written as
 * factories, e.g. `(dep) => (req, res, next) => {...}` or
 * `() => async (req, res) => {...}`. The returned inner function is never
 * assigned to a variable, so it has no `.name` - Express itself reports
 * these as the literal string "<anonymous>" (not an empty string), so that
 * exact value must be checked for explicitly. Shown here as
 * `unnamed#<position>` instead.
 *
 * To get a real name instead, name the inner function expression at its
 * declaration (one-time change, no route file edits needed). This is
 * generally good practice anyway - named functions show up correctly in
 * stack traces, profiler output and debugger call stacks, not just here.
 * Applies equally to middleware and controllers, e.g.:
 *   return (req, res, next) => {...}                            // unnamed#N in the log
 *   return function getPersonAppointment(req, res, next) {...}  // shows as "getPersonAppointment"
 *
 *   return async (req, res) => {...}                           // unnamed#N in the log
 *   return async function getLocationNotInList(req, res) {...} // shows as "getLocationNotInList"
 *
 * Only mounted in development, and only when NOT explicitly disabled via
 * DISABLE_DEV_REQUEST_LOGGING=true (set in feature.env /
 * docker-compose-feature-dev.yml, to avoid flooding output during Cypress/CI
 * runs) - see app.ts. Requires instrumentRouter() to have been called before
 * routes are registered (also see app.ts).
 */
export default function requestLogger(): RequestHandler {
  // Named (rather than a plain arrow function) so it shows up in the
  // handlers log as "use:requestLoggerHandler" instead of "use:unnamed#N".
  return function requestLoggerHandler(req, res, next) {
    if (req.path.startsWith('/assets') || req.path === '/favicon.ico') {
      return next()
    }

    const start = Date.now()
    logger.debug({ method: req.method, path: req.originalUrl }, 'request received')

    res.on('finish', () => {
      logger.debug(
        {
          method: req.method,
          path: req.originalUrl,
          route: req.route?.path,
          handlers: req.handlerTrace,
          status: res.statusCode,
          durationMs: Date.now() - start,
        },
        'request completed',
      )
    })

    return next()
  }
}
