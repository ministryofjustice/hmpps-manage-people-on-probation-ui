import caseloadController from './caseload'
import activityLogController from './activityLog'
import personalDetailsController from './personalDetails'
import appointmentsController from './appointments'
import caseController from './case'
import complianceController from './compliance'
import homeController from './home'
import interventionsController from './interventions'
import riskController from './risk'
import sentenceController from './sentence'
import arrangeAppointmentController from './arrangeAppointment'
import documentController from './documents'
import accessibilityController from './accessibility'
import searchController from './search'
import dateController from './calendar'

export default {
  caseload: caseloadController,
  activityLog: activityLogController,
  personalDetails: personalDetailsController,
  appointments: appointmentsController,
  case: caseController,
  compliance: complianceController,
  home: homeController,
  interventions: interventionsController,
  risk: riskController,
  sentence: sentenceController,
  arrangeAppointments: arrangeAppointmentController,
  document: documentController,
  accessibility: accessibilityController,
  search: searchController,
  calendar: dateController,
}
