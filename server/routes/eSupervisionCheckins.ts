import { type Router } from 'express'
import type { Services } from '../services'
import controllers from '../controllers'
import validate from '../middleware/validation'
import { autoStoreSessionData } from '../middleware'

export default function eSuperVisionCheckInsRoutes(router: Router, { hmppsAuthClient }: Services) {
  router.get('/case/:crn/appointments/check-in/instructions', [controllers.checkIns.getIntroPage(hmppsAuthClient)])

  router.post('/case/:crn/appointments/check-in/instructions', [controllers.checkIns.postIntroPage(hmppsAuthClient)])

  router.get('/case/:crn/appointments/:id/check-in/date-frequency', [
    controllers.checkIns.getDateFrequencyPage(hmppsAuthClient),
  ])

  router.post(
    '/case/:crn/appointments/:id/check-in/date-frequency',
    autoStoreSessionData(hmppsAuthClient),
    validate.eSuperVision,
    controllers.checkIns.postDateFrequencyPage(),
  )

  router.get('/case/:crn/appointments/:id/check-in/contact-preference', [
    controllers.checkIns.getContactPreferencePage(hmppsAuthClient),
  ])
}
