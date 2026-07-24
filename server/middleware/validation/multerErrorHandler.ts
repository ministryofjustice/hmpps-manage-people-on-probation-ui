import { Request, Response, NextFunction } from 'express'
import multer, { MulterError } from 'multer'
import { urlToRenderPath } from '../../utils/urlToRenderPath'
import config from '../../config'
import { isValidFileName } from '../../utils/validationUtils'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (
      !Object.entries(config.validMimeTypes)
        .map(([_k, v]) => v)
        .includes(file.mimetype)
    ) {
      return cb(new MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname))
    }
    if (!isValidFileName(file.originalname)) {
      return cb(new Error('INVALID_FILE_NAME'))
    }
    return cb(null, true)
  },
})
export const multerErrorHandler = (field: string) => {
  return function multerErrorHandlerInner(req: Request, res: Response, next: NextFunction) {
    upload.single(field)(req, res, err => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.locals.errorMessages = {
            [field]: 'File size must be 5mb or under',
          }
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          res.locals.errorMessages = {
            [field]: 'Only PDF or Word files are allowed',
          }
        }
        if (err.message === 'INVALID_FILE_NAME') {
          res.locals.errorMessages = {
            [field]:
              'Filename: The Filename must not include any of the following characters ! | $ % & # ^ / \\ " < > : ? *',
          }
        }
        res.locals.renderPath = urlToRenderPath(req, res)
      }
      return next()
    })
  }
}
