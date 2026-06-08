import multer from 'multer'
import { type Router } from 'express'
import controllers from '../controllers'
import { Services } from '../services'
import {
  getPersonalDetails,
  getPersonAppointment,
  autoStoreSessionData,
  getAppointmentTypes,
  getSentences,
  parseMultipartBody,
  forceValidation,
} from '../middleware'
import { getNotePrepend, getOutcomeProps, getOutcomeSentence } from '../middleware/appointment-outcomes'
import validate from '../middleware/validation/index'
import config from '../config'
import { multerErrorHandler } from '../middleware/validation/multerErrorHandler'

export default function manageAppointmentRoutes(router: Router, { hmppsAuthClient, arnsComponents }: Services) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: config.maxFileSize,
      files: 1,
    },
  })

  router.all(
    '/case/:crn/appointments/appointment/:contactId/add-note',
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getPersonAppointment(hmppsAuthClient),
    getOutcomeProps,
  )
  router.get(
    '/case/:crn/appointments/appointment/:contactId/add-note',
    controllers.appointments.getAddNote(hmppsAuthClient),
  )

  router.post(
    '/case/:crn/appointments/appointment/:contactId/add-note',
    multerErrorHandler('fileUpload'),
    validate.appointments,
    controllers.appointments.postAddNote(hmppsAuthClient),
  )

  router.all(
    '/case/:crn/appointments/appointment/:contactId/outcome/add-note',
    getAppointmentTypes(hmppsAuthClient),
    getPersonAppointment(hmppsAuthClient),
    getSentences(hmppsAuthClient),
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getOutcomeProps,
    getOutcomeSentence(hmppsAuthClient),
    getNotePrepend,
  )

  router.get(
    '/case/:crn/appointments/appointment/:contactId/outcome/add-note',
    forceValidation,
    controllers.appointmentOutcomes.getAddNote(hmppsAuthClient),
  )

  router.post(
    '/case/:crn/appointments/appointment/:contactId/outcome/add-note',
    multerErrorHandler('fileUpload'),
    parseMultipartBody,
    validate.appointmentOutcomes,
    autoStoreSessionData(hmppsAuthClient),
    controllers.appointmentOutcomes.postAddNote(hmppsAuthClient),
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

  return router
}
