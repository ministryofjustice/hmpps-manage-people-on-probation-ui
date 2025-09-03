import { Route } from '../../@types'
import config from '../../config'

const fileUpload: Route<void> = (req, res, next) => {
  const files = req.files as Express.Multer.File[]

  let isValid = true
  let status = null

  const validateMimeType = (file: Express.Multer.File) => {
    const validMimeTypes = Object.entries(config.validMimeTypes).map(([_key, mimetype]) => mimetype)
    if (!validMimeTypes.includes(file.mimetype)) {
      isValid = false
      status = 415
    }
  }

  const validateFileSize = (file: Express.Multer.File) => {
    if (file.size > config.maxFileSize) {
      status = 413
    }
  }

  for (const file of files) {
    validateMimeType(file)
    if (isValid) {
      validateFileSize(file)
    }
  }
  if (status) {
    res.locals.fileErrorStatus = status
  }
  return next()
}

export default fileUpload
