import multer from 'multer'
import { type Router } from 'express'
import controllers from '../controllers'
import { Services } from '../services'
import {
  getPersonalDetails,
  getPersonAppointment,
  redirectWizard,
  getAppointment,
  autoStoreSessionData,
  getAppointmentTypes,
  getSentences,
  parseMultipartBody,
} from '../middleware'
import { getNotePrepend, getOutcomeProps } from '../middleware/appointment-outcomes'
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

  /* Outcome add notes page */

  router.all(
    [
      '/case/:crn/arrange-appointment/:id/outcome/add-note',
      '/case/:crn/appointments/appointment/:contactId/outcome/add-note',
    ],
    getAppointmentTypes(hmppsAuthClient),
    getSentences(hmppsAuthClient),
  )

  router.all('/case/:crn/appointments/appointment/:contactId/outcome/add-note', getPersonAppointment(hmppsAuthClient))

  router.all(
    [
      '/case/:crn/arrange-appointment/:id/outcome/add-note',
      '/case/:crn/appointments/appointment/:contactId/outcome/add-note',
    ],
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getOutcomeProps,
  )

  router.post(
    '/case/:crn/appointments/appointment/:contactId/outcome/add-note',
    multerErrorHandler('fileUpload'),
    parseMultipartBody,
    validate.appointmentOutcomes,
    getNotePrepend,
    autoStoreSessionData(hmppsAuthClient),
    controllers.appointmentOutcomes.postAddNote(hmppsAuthClient),
  )

  router.get(
    [
      '/case/:crn/arrange-appointment/:id/outcome/add-note',
      '/case/:crn/appointments/appointment/:contactId/outcome/add-note',
    ],
    controllers.appointmentOutcomes.getAddNote(hmppsAuthClient),
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
    getPersonalDetails(hmppsAuthClient, arnsComponents),
    getAppointment(hmppsAuthClient),
    getOutcomeProps,
  )
  router.get('/case/:crn/arrange-appointment/:id/add-note', controllers.arrangeAppointments.getAddNote())

  router.post(
    '/case/:crn/arrange-appointment/:id/add-note',
    validate.appointments,
    autoStoreSessionData(hmppsAuthClient),
    controllers.arrangeAppointments.postAddNote(),
  )
  return router
}
