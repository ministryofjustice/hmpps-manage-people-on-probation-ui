import { Request, Response, NextFunction } from 'express'
import { MulterError } from 'multer'

export function multerErrorHandler(err: Error | MulterError, req: Request, res: Response, next: NextFunction) {
  if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
    req.session.errorMessages = {
      ...(req.session.errorMessages || {}),
      'file-upload-1': 'File size must be 5mb or under',
    }

    return res.render('pages/appointments/add-note', {
      crn: req.params.crn,
      errorMessages: req.session.errorMessages,
      body: req.body || null,
      url: '',
      maxCharCount: 4000,
    })
  }

  return next(err)
}
