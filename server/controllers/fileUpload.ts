import { Controller, FileCache, FileUploadResponse } from '../@types'
import MasApiClient from '../data/masApiClient'

const routes = ['postUploadFile', 'postDeleteFile'] as const

const fileUploadController: Controller<typeof routes, any> = {
  postUploadFile: hmppsAuthClient => {
    return async (req, res) => {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      let status = 200
      const files = req.files as Express.Multer.File[]
      const file = files[0]
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
          // post the file to alfresco
          await masClient.patchDocuments(crn, id, file.buffer)
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
