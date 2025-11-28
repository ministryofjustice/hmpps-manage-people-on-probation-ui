import multer from 'multer'
import { type Router } from 'express'
import controllers from '../controllers'
import { Services } from '../services'
import {
  getPersonalDetails,
  getPersonAppointment,
  redirectWizard,
  cacheUploadedFiles,
  parseMultipartBody,
  getAppointment,
  autoStoreSessionData,
} from '../middleware'
import validate from '../middleware/validation/index'
import config from '../config'

export default function multipartRoutes(router: Router, { hmppsAuthClient }: Services) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: config.maxFileSize * config.fileUploadLimit,
      fieldSize: 1 * 1024 * 1024, // 1 MB max per field
      files: config.fileUploadLimit,
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
    parseMultipartBody,
    cacheUploadedFiles,
    validate.appointments,
    controllers.appointments.postAddNote(hmppsAuthClient),
  )
  router.post(
    '/appointments/file/upload',
    upload.array('documents'),
    controllers.fileUpload.postUploadFile(hmppsAuthClient),
  )
  router.post(
    '/appointments/file/delete',
    upload.single('file'),
    controllers.fileUpload.postDeleteFile(hmppsAuthClient),
  )
  router.all(
    '/case/:crn/arrange-appointment/:id/add-note',
    redirectWizard(['eventId', 'type', 'date', 'outcomeRecorded']),
    getPersonalDetails(hmppsAuthClient),
    getAppointment(hmppsAuthClient),
  )
  router.get('/case/:crn/arrange-appointment/:id/add-note', controllers.arrangeAppointments.getAddNote())

  router.post(
    '/case/:crn/arrange-appointment/:id/add-note',
    // upload.array('file'),
    // parseMultipartBody,
    // cacheUploadedFiles,
    autoStoreSessionData(hmppsAuthClient),
    validate.appointments,
    controllers.arrangeAppointments.postAddNote(),
  )
  return router
}
