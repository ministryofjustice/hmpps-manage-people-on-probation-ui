import caseloadController from './caseload'
import activityLogController from './activityLog'
import addContactController from './addContact'
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
import fileUploadController from './fileUpload'
import alertsController from './alerts'
import checkInsController from './check-ins'
import rescheduleAppointmentController from './rescheduleAppointments'
import whatsNewController from './whatsNewController'

export default {
  caseload: caseloadController,
  activityLog: activityLogController,
  addContact: addContactController,
  personalDetails: personalDetailsController,
  appointments: appointmentsController,
  case: caseController,
  compliance: complianceController,
  home: homeController,
  whatsNew: whatsNewController,
  interventions: interventionsController,
  risk: riskController,
  sentence: sentenceController,
  arrangeAppointments: arrangeAppointmentController,
  rescheduleAppointments: rescheduleAppointmentController,
  document: documentController,
  accessibility: accessibilityController,
  search: searchController,
  fileUpload: fileUploadController,
  alerts: alertsController,
  checkIns: checkInsController,
}
