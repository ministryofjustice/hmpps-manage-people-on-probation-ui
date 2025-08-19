import { Controller } from '../@types'
import { AppResponse } from '../models/Locals'

const routes = ['postUploadFile', 'postDeleteFile'] as const

interface FileUploadResponse {
  file: {
    id: string
    name: string
    size: number
  }
  success?: {
    messageText: string
    messageHtml: string
  }
  error?: {
    message: string
  }
}

const fileUploadController: Controller<typeof routes, AppResponse> = {
  postUploadFile: _hmppsAuthClient => {
    return async (req, res) => {
      let status = 200
      const file = (req.files as Express.Multer.File[])[0]
      const { originalname: name, size } = file
      const response: FileUploadResponse = {
        file: {
          id: '1',
          name,
          size,
        },
      }
      if (res.locals.fileErrorStatus) {
        status = res.locals.fileErrorStatus
        response.error = {
          message: 'ERROR!',
        }
      } else {
        response.success = {
          messageHtml: name,
          messageText: name,
        }
      }
      return res.status(status).json(response)
    }
  },
  postDeleteFile: _hmppsAuthClient => {
    return async (_req, res) => {
      return res.json({
        success: true,
      })
    }
  },
}

export default fileUploadController
