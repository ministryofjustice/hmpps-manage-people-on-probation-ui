import multer from 'multer'
import { type Router } from 'express'
import controllers from '../controllers'
import { Services } from '../services'
import { getPersonalDetails, getPersonAppointment } from '../middleware'
import validate from '../middleware/validation/index'
import { cacheUploadedFiles } from '../middleware/cacheUploadedFiles'
import config from '../config'

export default function multipartRoutes(router: Router, { hmppsAuthClient }: Services) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fieldSize: 1 * 1024 * 1024, // 1 MB max per field
      files: 5,
    },
  })

  router.all(
    '/case/:crn/appointments/appointment/:contactId/add-note',
    getPersonalDetails(hmppsAuthClient),
    getPersonAppointment(hmppsAuthClient),
  )
  router.get(
    '/case/:crn/appointments/appointment/:contactId/add-note',
    controllers.appointments.getAddNote(hmppsAuthClient),
  )
  router.post(
    '/case/:crn/appointments/appointment/:contactId/add-note',
    upload.array('documents'),
    cacheUploadedFiles,
    validate.appointments,
    controllers.appointments.postAddNote(hmppsAuthClient),
  )
  router.post(
    '/appointments/file/upload',
    upload.array('documents'),
    validate.fileUpload,
    controllers.fileUpload.postUploadFile(hmppsAuthClient),
  )
  router.post(
    '/appointments/file/delete',
    upload.single('file'),
    controllers.fileUpload.postDeleteFile(hmppsAuthClient),
  )
  return router
}
