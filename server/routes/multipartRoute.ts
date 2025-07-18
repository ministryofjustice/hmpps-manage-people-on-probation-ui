import { type Router } from 'express'
import multer from 'multer'
import validate from '../middleware/validation/index'
import controllers from '../controllers'

export default function multipartRoute(router: Router) {
  const upload = multer()
  router.post(
    '/case/:crn/arrange-appointment/:id/add-notes',
    upload.single('file'),
    validate.appointments,
    controllers.arrangeAppointments.postNotes(),
  )
  return router
}
