import { Router } from 'express'
import type { Services } from '../services'
import home from './home'
import searchRoutes from './search'
import caseRoutes from './case'
import personalDetailRoutes from './personalDetails'
import sentenceRoutes from './sentence'
import scheduleRoutes from './appointments'
import activityLogRoutes from './activityLog'
import addContactRoutes from './addContact'
import risksRoutes from './risks'
import complianceRoutes from './compliance'
import caseloadRoutes from './caseload'
import accessibilityRoutes from './accessibilityRoutes'
import interventionsRoutes from './interventions'
import arrangeAppointmentRoutes from './arrangeAppointment'
import documentsRoutes from './documents'
import alertsRoutes from './alerts'
import eSuperVisionCheckInsRoutes from './eSupervisionCheckins'
import rescheduleAppointmentRoutes from './rescheduleAppointments'
import whatsNew from './whatsNew'
import appointmentOutcomesRoutes from './appointmentOutcomes'
import footerRoute from './footer'
import enforcementActionsRoutes from './enforcementActions'

export default function routes(router: Router, services: Services): Router {
  home(router, services)
  searchRoutes(router, services)
  caseRoutes(router, services)
  personalDetailRoutes(router, services)
  sentenceRoutes(router, services)
  scheduleRoutes(router, services)
  risksRoutes(router, services)
  activityLogRoutes(router, services)
  addContactRoutes(router, services)
  complianceRoutes(router, services)
  caseloadRoutes(router, services)
  accessibilityRoutes(router)
  interventionsRoutes(router, services)
  arrangeAppointmentRoutes(router, services)
  rescheduleAppointmentRoutes(router, services)
  appointmentOutcomesRoutes(router, services)
  documentsRoutes(router, services)
  alertsRoutes(router, services)
  eSuperVisionCheckInsRoutes(router, services)
  whatsNew(router, services)
  footerRoute(router, services)
  enforcementActionsRoutes(router, services)
  return router
}
