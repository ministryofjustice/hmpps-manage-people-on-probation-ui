import { Controller } from '../@types'
import { AppResponse } from '../models/Locals'

const routes = ['postUploadFile', 'postDeleteFile'] as const

const fileUploadController: Controller<typeof routes, AppResponse> = {
  postUploadFile: _hmppsAuthClient => {
    return async (req, res) => {
      // console.dir(req.files, { depth: null })
      // return res.send('Upload file')

      return res.json({
        file: {
          id: '123456',
          name: 'document.pdf',
          size: 23456,
        },
        success: true,
      })
    }
  },
  postDeleteFile: _hmppsAuthClient => {
    return async (_req, res) => {
      return res.send('Delete file')
      // return res.json({
      //   success: true,
      // })
    }
  },
}

export default fileUploadController
