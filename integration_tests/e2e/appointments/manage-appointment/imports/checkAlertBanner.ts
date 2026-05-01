import ManageAppointmentPage from '../../../../pages/appointments/manage-appointment.page'
import { loadPage } from './common'

export const checkAlertBanner = () => {
  let manageAppointmentPage: ManageAppointmentPage
  describe('Appointment is in the future', () => {
    beforeEach(() => {
      cy.task('stubAppointment', { deliusManaged: false, notes: true })
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })
    it('should not show the alert', () => {
      manageAppointmentPage.getAlertBanner().should('not.exist')
    })
  })
  describe('Appointment is NDelius managed', () => {
    beforeEach(() => {
      cy.task('stubAppointment', { deliusManaged: true, notes: false })
      loadPage()
    })
    it('should not display the alert', () => {
      manageAppointmentPage.getAlertBanner().should('not.exist')
    })
  })
  describe('Appointment is in the past', () => {
    describe('Outcome not logged and no notes', () => {
      beforeEach(() => {
        cy.task('stubAppointment', { deliusManaged: false, isFuture: false, hasOutcome: false, notes: false })
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
        cy.task('stubAppointment', {
          deliusManaged: false,
          isFuture: false,
          hasOutcome: true,
          hasComplied: true,
          notes: false,
        })
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display the alert banner with the correct message', () => {
        manageAppointmentPage.getAlertBanner().should('contain.text', 'You should add notes to this appointment.')
      })
    })
    describe('No outcome logged, has notes', () => {
      beforeEach(() => {
        cy.task('stubAppointment', { deliusManaged: false, isFuture: false, hasOutcome: false, notes: true })
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display the alert banner with the correct message', () => {
        manageAppointmentPage.getAlertBanner().should('contain.text', 'You must log an outcome for this appointment.')
      })
    })
  })
}
