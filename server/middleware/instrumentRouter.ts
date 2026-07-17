import { Router } from 'express'

// Express's `Router` (and by extension `app`, which delegates to its own
// internal Router) is used to register handlers via multiple separate calls
// for the very same path, e.g:
//
//   router.all('/case/:crn/thing', mwAll1, mwAll2)
//   router.get('/case/:crn/thing', mwGet1, controller)
//
// By the time a request finishes, `req.route` only reflects the LAST matched
// Route object (the router.get one here), so `req.route.stack` silently omits
// mwAll1/mwAll2 even though they genuinely ran. There is no supported Express
// API that exposes the true, full, cross-registration handler chain.
//
// To capture it, this patches the HTTP verb methods (and `use`) on
// `Router.prototype` ONCE, at app startup, before any routes are registered.
// Each handler function passed to these methods is wrapped so that when it
// actually executes, it appends "<method>:<name>" (e.g. "get:controller",
// "all:mwAll1") to `req.handlerTrace` - building up the real chronological
// chain across every router.all()/get()/post()/use() call that runs for a
// given request, and showing which registration method added each handler,
// regardless of how the app happens to split registrations for the same
// path.
//
// Must be called once, in development only, before route files are invoked
// (see app.ts) - it patches the shared Router prototype, so timing relative
// to route registration matters, not import order. It must also run before
// app.use(requestLogger()) itself, or requestLogger's own registration won't
// be captured in the trace.
//
// Caveat: this only patches Router.prototype, not Express's separate
// internal Route class. `app.get('/path', handler)` / `app.post(...)` etc
// called directly on `app` (not on a Router() instance) are NOT covered,
// because Express internally delegates those single-path overloads to
// Route.prototype rather than Router.prototype. Not an issue in this
// codebase, which always registers routes via Router() instances (see
// server/routes/*.ts) mounted with app.use(router) - only app.use(...) is
// ever called directly on `app`.
//
// Each entry in req.handlerTrace (and the `handlers` field logged by
// requestLogger.ts) is formatted as "<registrationMethod>:<name>", e.g:
//   "use:session"        -> registered via app.use(...) or router.use(...)
//   "all:getSentences"   -> registered via router.all(...) - runs for every
//                           HTTP method on that path
//   "get:forceValidation" -> registered via router.get(...) - runs only for
//                            GET requests
//   "post:checkAnswers"   -> registered via router.post(...) - runs only for
//                            POST requests
// (same idea for put/patch/delete). This prefix reflects HOW the handler was
// REGISTERED, not the HTTP method of the incoming request - that's the
// separate top-level `method` field logged by requestLogger.ts.
const METHODS_TO_WRAP = ['all', 'get', 'post', 'put', 'patch', 'delete', 'use'] as const

declare module 'express-serve-static-core' {
  interface Request {
    handlerTrace?: string[]
  }
}

let instrumented = false

export default function instrumentRouter(): void {
  // Router.prototype is a shared singleton - patching it more than once
  // (e.g. if this is called again, or in multiple test files) would wrap
  // already-wrapped methods again, double-counting handlers. Guard against
  // that.
  if (instrumented) {
    return
  }
  instrumented = true

  METHODS_TO_WRAP.forEach(method => {
    const original = Router.prototype[method]

    Router.prototype[method] = function patched(...args: any[]) {
      const wrappedArgs = args.map(arg => {
        // Skip non-functions, and nested routers/sub-apps (identifiable by
        // their own `.stack` array) - only wrap genuine handler functions.
        if (typeof arg !== 'function' || arg.stack) {
          return arg
        }

        const label = arg.name && arg.name !== '<anonymous>' ? arg.name : undefined

        const record = (req: any) => {
          req.handlerTrace = req.handlerTrace || []
          // Prefixed with the registration method (all/get/post/...) so it's
          // clear which router.<method>() call added this handler - useful
          // when the same path is split across multiple registrations.
          req.handlerTrace.push(`${method}:${label || `unnamed#${req.handlerTrace.length + 1}`}`)
        }

        // Express decides whether middleware is an error handler purely by
        // checking `fn.length === 4` (i.e. it was declared with exactly 4
        // params: (err, req, res, next)). Wrapping with a rest-param function
        // would collapse `.length` to something else and silently break
        // error handling - Express would stop invoking it on errors. So
        // error-handling middleware must be wrapped with a function that
        // preserves that exact 4-param arity, with `req` as the 2nd param.
        if (arg.length === 4) {
          return function wrappedErrorHandler(this: unknown, err: any, req: any, res: any, next: any) {
            record(req)
            return arg.apply(this, [err, req, res, next])
          }
        }

        return function wrappedHandler(this: unknown, req: any, ...rest: any[]) {
          record(req)
          return arg.apply(this, [req, ...rest])
        }
      })

      return original.apply(this, wrappedArgs)
    }
  })
}
