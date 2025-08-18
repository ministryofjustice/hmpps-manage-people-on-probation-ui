import multer from 'multer'
import { type Router } from 'express'
import controllers from '../controllers'
import { Services } from '../services'
import { getPersonalDetails, getPersonAppointment } from '../middleware'

export default function multipartRoutes(router: Router, { hmppsAuthClient }: Services) {
  const upload = multer()

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

  return router
}
