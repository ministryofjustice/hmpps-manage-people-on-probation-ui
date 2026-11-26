import type { NextFunction, Request } from 'express'
import { AppResponse } from '../models/Locals'

type Middleware = (req: Request, res: AppResponse, next: NextFunction) => unknown

// Resolves when the middleware calls next(), rejects if it calls next(err) or throws
const runMiddleware = (fn: Middleware, req: Request, res: AppResponse): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    Promise.resolve()
      .then(() => fn(req, res, (err?: unknown) => (err ? reject(err) : resolve())))
      .catch(reject)
  })

/**
 * Runs the given middleware concurrently, then calls next() once they have all called next().
 * An array entry is run in sequence, for middleware that depends on another's res.locals or session data.
 * Every middleware must call next() - one that ends the response itself will leave the request hanging.
 */
export default function parallelMiddleware(...middleware: (Middleware | Middleware[])[]) {
  return async function parallelMiddlewareInner(req: Request, res: AppResponse, next: NextFunction): Promise<void> {
    try {
      await Promise.all(
        middleware.map(async entry => {
          for (const fn of [entry].flat()) {
            // eslint-disable-next-line no-await-in-loop
            await runMiddleware(fn, req, res)
          }
        }),
      )
    } catch (err) {
      return next(err)
    }
    return next()
  }
}
