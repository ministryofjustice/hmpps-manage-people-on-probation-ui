import { Controller, FileCache, FileUploadResponse } from '../@types'

const routes = ['postUploadFile', 'postDeleteFile'] as const

const fileUploadController: Controller<typeof routes, any> = {
  postUploadFile: _hmppsAuthClient => {
    return async (req, res) => {
      let status = 200
      const files = req.files as Express.Multer.File[]
      const file = files[0]
      const { originalname: name, size } = file
      const { id } = req.params

      const errors = {
        type: 'The selected file must be a PDF or Word document',
        size: 'The selected file must be 5mb or under',
      }

      const fileCache: FileCache = {
        id,
        name,
      }
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
        fileCache.error = status === 415 ? errors.type : errors.size
      } else {
        // post the file to alfresco here

        // update the session with success
        response.success = {
          messageHtml: name,
          messageText: name,
        }
        fileCache.uploaded = true
      }

      const cachedFiles: FileCache[] = [...(req?.session?.cache?.uploadedFiles ?? []), fileCache]
      req.session.cache = {
        ...(req?.session?.cache ?? {}),
        uploadedFiles: cachedFiles,
      }
      req.session.save(() => {
        return res.status(status).json(response)
      })
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
