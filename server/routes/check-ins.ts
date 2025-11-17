import { type Router } from 'express'
import type { Services } from '../services'
import controllers from '../controllers'

export default function checkInsRoutes(router: Router, { hmppsAuthClient }: Services) {
  router.get('/case/:crn/appointments/check-in/instructions', [controllers.checkIns.getIntroPage(hmppsAuthClient)])
}
