import { Request, Response, NextFunction } from 'express'
import multer, { MulterError } from 'multer'
import path from 'path'
import { urlToRenderPath } from '../../utils/urlToRenderPath'
import config from '../../config'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const isAllowedMimeType = Object.values(config.validMimeTypes).includes(file.mimetype)

    const extension = path.extname(file.originalname).toLowerCase()
    if (
      !isAllowedMimeType ||
      (file.mimetype === config.validMimeTypes.jpeg && extension !== config.validFileExtensions.jpeg)
    ) {
      return cb(new MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname))
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
            [field]: 'Only PDF, Word or JPEG files are allowed',
          }
        }
        res.locals.renderPath = urlToRenderPath(req, res)
      }
      return next()
    })
  }
}
