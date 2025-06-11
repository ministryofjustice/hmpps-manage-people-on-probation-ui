import { Router } from 'express'
import csurf from 'csurf'
import { AppResponse } from '../models/Locals'

const testMode = process.env.NODE_ENV === 'test'

export default function setUpCsrf(): Router {
  const router = Router({ mergeParams: true })

  // CSRF protection
  if (!testMode) {
    router.use(csurf())
  }

  router.use((req, res: AppResponse, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  return router
}
