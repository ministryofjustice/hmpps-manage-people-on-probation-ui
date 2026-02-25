import { Request } from 'express'
import { type Controller } from '../types/Controller'
import { type FileUploadResponse } from '../types/FileUpload'
import MasApiClient from '../data/masApiClient'
import { AppResponse } from '../models/Locals'

const routes = ['postUploadFile', 'postDeleteFile'] as const

const fileUploadController: Controller<typeof routes, any> = {
  postUploadFile: hmppsAuthClient => {
    return async (req: Request, res: AppResponse) => {
      const sleep = (ms: number) => {
        return new Promise(resolve => {
          setTimeout(resolve, ms)
        })
      }
      if (!hmppsAuthClient) throw new Error('No hmppsAuthClient')
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      let status = 200
      const file = req.file as Express.Multer.File
      const { id, crn } = req.body
      const { originalname: originalName, size } = file
      const errors = {
        type: 'The selected file must be a PDF or Word document',
        size: 'The selected file must be 5mb or under',
      }
      const setErrorMessage = (message = '') => {
        response.error = {
          message,
        }
      }
      const response: FileUploadResponse = {
        file: {
          id,
          name: originalName,
          size,
        },
      }
      if (res.locals.fileErrorStatus) {
        status = res.locals.fileErrorStatus
        setErrorMessage(status === 415 ? errors.type : errors.size)
      } else {
        try {
          await masClient.patchDocuments(crn, id, file)
          await sleep(500)
          response.success = {
            messageHtml: originalName,
            messageText: originalName,
          }
        } catch (error) {
          const err = error as Error
          setErrorMessage(err?.message ?? '')
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
