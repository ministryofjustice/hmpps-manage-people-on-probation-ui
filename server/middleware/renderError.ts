import { Request, Response } from 'express'
import { StatusErrorCode, statusErrors } from '../properties'

export const renderError =
  (status: StatusErrorCode) =>
  (_req: Request, res: Response): void => {
    const { title, message } = statusErrors[status]
    res.locals.title = title
    res.locals.message = message
    return res.status(status).render('pages/error')
  }
