import { Request, Response, NextFunction } from 'express'
import { MulterError } from 'multer'

import { urlToRenderPath } from '../../utils/urlToRenderPath'

export function multerErrorHandler(
  err: Error | MulterError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
    res.locals.errorMessages = {
      ...(res.locals.errorMessages ?? {}),
      'file-upload-1': 'File size must be 5mb or under',
    }
    res.locals.renderPath = urlToRenderPath(req, res)
    return next()
  }

  return next(err)
}
