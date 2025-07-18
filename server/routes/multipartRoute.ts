import { type Router } from 'express'
import multer from 'multer'
import validate from '../middleware/validation/index'
import controllers from '../controllers'
import { autoStoreSessionData, getAppointment } from '../middleware'
import { Services } from '../services'

export default function multipartRoute(router: Router, { hmppsAuthClient }: Services) {
  const upload = multer()
  /* 
  multer memory storage does not persist across requests - would need to use redis
  const upload = multer({ storage: multer.memoryStorage() })
  */
  router.post(
    '/case/:crn/arrange-appointment/:id/add-notes',
    upload.single('file'),
    getAppointment(hmppsAuthClient),
    validate.appointments,
    autoStoreSessionData(hmppsAuthClient),
    controllers.arrangeAppointments.postNotes(),
  )
  return router
}
