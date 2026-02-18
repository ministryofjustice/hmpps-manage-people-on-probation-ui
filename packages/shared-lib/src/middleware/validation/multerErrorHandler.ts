import { Request, Response, NextFunction } from 'express'
import multer, { MulterError } from 'multer'
import { getConfig } from '../../config'
import { urlToRenderPath } from '../../utils/urlToRenderPath'

const initUpload = () => {
  const config = getConfig()
  return multer({
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
      return cb(null, true)
    },
  })
}

export const multerErrorHandler = (field: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const upload = initUpload()
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
        res.locals.renderPath = urlToRenderPath(req, res)
      }
      return next()
    })
  }
}
