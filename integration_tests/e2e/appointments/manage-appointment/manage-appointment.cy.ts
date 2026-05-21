import ManageAppointmentPage from '../../../pages/appointments/manage-appointment.page'
import {
  checkAppointmentDetails,
  checkAppointmentNotesAction,
  checkUploadDocumentsAction,
  checkArrangeNextAppointmentAction,
  checkAlertBanner,
  checkRescheduleLink,
  checkLogOutcomeAction,
} from './imports'
import { crn, appointmentId, loadPage } from './imports/common'

let manageAppointmentPage: ManageAppointmentPage

const appointmentActions = (enableNonCompliance = true) => {
  checkLogOutcomeAction(enableNonCompliance)
  checkAppointmentNotesAction()
  if (enableNonCompliance) {
    checkUploadDocumentsAction()
  }
  checkArrangeNextAppointmentAction(enableNonCompliance)
}

const appointmentDetails = (enableNonCompliance = true) => {
  describe('MPOP managed appointment', () => {
    checkAppointmentDetails({ deliusManaged: false, enableNonCompliance })
  })

  describe('Delius managed appointment type, no outcome', () => {
    beforeEach(() => {
      cy.task('stubAppointment', { deliusManaged: true, hasOutcome: false })
      loadPage()
    })
    checkAppointmentDetails({
      deliusManaged: true,
      hasOutcome: false,
      enableNonCompliance,
    })
  })
  describe('Delius managed appointment type, complied', () => {
    beforeEach(() => {
      cy.task('stubAppointment', { deliusManaged: true, hasOutcome: true, hasComplied: true })
      loadPage()
    })
    checkAppointmentDetails({
      deliusManaged: true,
      hasComplied: true,
      hasOutcome: true,
      enableNonCompliance,
    })
  })
  describe('Delius managed appointment, acceptable absence', () => {
    beforeEach(() => {
      cy.task('stubAppointment', { deliusManaged: true, hasOutcome: true, acceptableAbsence: true })
      loadPage()
    })
    checkAppointmentDetails({
      deliusManaged: true,
      hasComplied: false,
      acceptableAbsence: true,
      hasOutcome: true,
      enableNonCompliance,
    })
  })
  describe('Delius managed appointment, unacceptable absence', () => {
    beforeEach(() => {
      cy.task('stubAppointment', { deliusManaged: true, hasOutcome: true, acceptableAbsence: false })
      loadPage()
    })
    checkAppointmentDetails({
      deliusManaged: true,
      hasComplied: false,
      acceptableAbsence: false,
      hasOutcome: true,
      enableNonCompliance,
    })
  })
}

describe('Manage an appointment', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  it('should render the page', () => {
    loadPage()
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getBackLink().should('have.attr', 'href', `/case/${crn}/appointments`)
    manageAppointmentPage.checkPageTitle('Manage planned office visit (NS) with Terry Jones')
    manageAppointmentPage.getLastUpdated().should('contain.text', 'Last updated by Paul Smith on 20 March 2023')
  })
})
