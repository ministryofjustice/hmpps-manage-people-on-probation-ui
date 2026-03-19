import ManageAppointmentPage from '../../../../pages/appointments/manage-appointment.page'
import { loadPage } from './common'

export const checkAlertBanner = () => {
  let manageAppointmentPage: ManageAppointmentPage
  describe('Appointment is in the future', () => {
    beforeEach(() => {
      cy.task('stubFutureAppointmentManagedTypeWithNotes')
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })
    it('should not show the alert', () => {
      manageAppointmentPage.getAlertBanner().should('not.exist')
    })
  })
  describe('Appointment is NDelius managed', () => {
    beforeEach(() => {
      cy.task('stubAppointmentNDeliusManagedTypeNoNotesHasOutcome')
      loadPage()
    })
    it('should not display the alert', () => {
      manageAppointmentPage.getAlertBanner().should('not.exist')
    })
  })
  describe('Appointment is in the past', () => {
    describe('Outcome not logged and no notes', () => {
      beforeEach(() => {
        cy.task('stubPastAppointmentNoOutcomeNoNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display the alert banner with the correct message', () => {
        manageAppointmentPage
          .getAlertBanner()
          .should('contain.text', 'You must log an outcome and should add notes to this appointment.')
      })
    })
    describe('Outcome logged and no notes', () => {
      beforeEach(() => {
        cy.task('stubPastAppointmentOutcomeNoNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display the alert banner with the correct message', () => {
        manageAppointmentPage.getAlertBanner().should('contain.text', 'You should add notes to this appointment.')
      })
    })
    describe('No outcome logged, has notes', () => {
      beforeEach(() => {
        cy.task('stubPastAppointmentNoOutcomeHasNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display the alert banner with the correct message', () => {
        manageAppointmentPage.getAlertBanner().should('contain.text', 'You must log an outcome for this appointment.')
      })
    })
  })
}
