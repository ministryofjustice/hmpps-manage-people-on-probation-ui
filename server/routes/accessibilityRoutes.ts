import { Router } from 'express'
import controllers from '../controllers'

export default function accessibilityRoutes(router: Router) {
  router.get('/accessibility', controllers.accessibility.getAccessibility())
}
