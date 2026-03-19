import ManageAppointmentPage from '../../../../pages/appointments/manage-appointment.page'
import { loadPage, crn, appointmentId } from './common'

export const checkLogOutcomeAction = () => {
  let manageAppointmentPage: ManageAppointmentPage
  describe('Log attended and complied appointment', () => {
    const name = 'Log attended and complied appointment'
    beforeEach(() => {
      cy.task('stubFutureAppointmentManagedTypeNoNotes')
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })
    describe('Appointment is in the future', () => {
      it('should display the task name', () => {
        manageAppointmentPage.getTaskName(1).should('contain.text', name)
      })
      it('should not display a link to log the outcome', () => {
        manageAppointmentPage.getTaskLink(1).should('not.exist')
      })
      it('should display the hint text', () => {
        manageAppointmentPage
          .getTaskHint(1)
          .should('contain.text', 'You cannot log an attended and complied outcome until the appointment has happened')
      })
      it(`should display the status as 'Not started'`, () => {
        manageAppointmentPage
          .getTaskStatus(1)
          .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
          .should('contain.text', 'Not started')
      })
    })
    describe('Appointment is in the past, with no outcome logged', () => {
      beforeEach(() => {
        cy.task('stubPastAppointmentNoOutcomeNoNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to log the outcome', () => {
        manageAppointmentPage
          .getTaskLink(1)
          .should('contain.text', name)
          .should('have.attr', 'href', `/case/${crn}/appointments/appointment/${appointmentId}/attended-complied`)
      })
      it(`should display the status as 'Not started'`, () => {
        manageAppointmentPage
          .getTaskStatus(1)
          .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
          .should('contain.text', 'Not started')
      })
    })
    describe('Appointment is in the past with an outcome logged', () => {
      beforeEach(() => {
        cy.task('stubPastAppointmentOutcomeNoNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display the task name', () => {
        manageAppointmentPage.getTaskName(1).should('contain.text', name)
      })
      it('should not display a link to log the outcome', () => {
        manageAppointmentPage.getTaskLink(1).should('not.exist')
      })
      it(`should display the status as 'Complied'`, () => {
        manageAppointmentPage
          .getTaskStatus(1)
          .should('contain.html', 'class="govuk-tag govuk-tag--green"')
          .should('contain.text', 'Complied')
      })
    })
  })
}
