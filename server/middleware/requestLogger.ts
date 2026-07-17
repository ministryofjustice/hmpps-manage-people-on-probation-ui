import { type RequestHandler } from 'express'
import logger from '../../logger'

/**
 * High-level access-log style middleware. Logs one line when a request comes
 * in, and one line when the response finishes - covering method, path, matched
 * route pattern, status, duration, and the full list of handlers (middleware
 * and controller) registered for that route. This makes every route hit
 * (get/post/all) and its handler chain visible without manually instrumenting
 * individual middleware or controllers.
 * Only mounted in development - see app.ts.
 */
export default function requestLogger(): RequestHandler {
  return (req, res, next) => {
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
          // req.route.stack contains every handler registered for this route -
          // both middleware (server/middleware/*.ts) and the final controller
          // (server/controllers/*.ts), in registration order. The last entry is
          // typically the controller/route handler.
          //
          // Many of these - middleware and controllers alike - are written as
          // factories, e.g. `(dep) => (req, res, next) => {...}` or
          // `() => async (req, res) => {...}`. The returned inner function is
          // never assigned to a variable, so it has no `.name` - Express itself
          // reports these as the literal string "<anonymous>" (not an empty
          // string), so that exact value must be checked for explicitly. Shown
          // here as `unnamed#<position>` instead.
          //
          // To get a real name instead, name the inner function expression at
          // its declaration (one-time change, no route file edits needed). This
          // is generally good practice anyway - named functions show up
          // correctly in stack traces, profiler output and debugger call
          // stacks, not just here. Applies equally to middleware and
          // controllers, e.g.:
          //   return (req, res, next) => {...}                            // unnamed#N in the log
          //   return function getPersonAppointment(req, res, next) {...}  // shows as "getPersonAppointment"
          //
          //   return async (req, res) => {...}                           // unnamed#N in the log
          //   return async function getLocationNotInList(req, res) {...} // shows as "getLocationNotInList"
          handlers: req.route?.stack?.map((layer: { name?: string }, index: number) =>
            layer.name && layer.name !== '<anonymous>' ? layer.name : `unnamed#${index + 1}`,
          ),
          status: res.statusCode,
          durationMs: Date.now() - start,
        },
        'request completed',
      )
    })

    return next()
  }
}
