import { Router } from 'express'

import type { Services } from '../services'

import home from './home'
import searchRoutes from './search'
import caseRoutes from './case'
import personalDetailRoutes from './personalDetails'
import sentenceRoutes from './sentence'
import scheduleRoutes from './appointments'
import activityLogRoutes from './activityLog'
import risksRoutes from './risks'
import complianceRoutes from './compliance'
import caseloadRoutes from './caseload'
import accessibilityRoutes from './accessibilityRoutes'
import interventionsRoutes from './interventions'
import arrangeAppointmentRoutes from './arrangeAppointment'
import documentsRoutes from './documents'
import calendar from '../controllers/calendar'
import dateRoutes from './calendar'

export default function routes(services: Services): Router {
  const router = Router()
  home(router, services)
  searchRoutes(router, services)
  caseRoutes(router, services)
  personalDetailRoutes(router, services)
  sentenceRoutes(router, services)
  scheduleRoutes(router, services)
  risksRoutes(router, services)
  activityLogRoutes(router, services)
  complianceRoutes(router, services)
  caseloadRoutes(router, services)
  accessibilityRoutes(router)
  interventionsRoutes(router, services)
  arrangeAppointmentRoutes(router, services)
  documentsRoutes(router, services)
  dateRoutes(router, services)
  return router
}
