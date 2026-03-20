import ManageAppointmentPage from '../../../../pages/appointments/manage-appointment.page'
import RescheduleAppointmentPage from '../../../../pages/appointments/reschedule-appointment.page'
import { loadPage } from './common'

export const checkRescheduleLink = (enableNonCompliance = true) => {
  let manageAppointmentPage: ManageAppointmentPage
  const index = enableNonCompliance ? 2 : 1
  describe('Appointment Reschedule link', () => {
    beforeEach(() => {
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })

    describe('Complied appointment with future date', () => {
      const name = 'Log appointment outcome'
      beforeEach(() => {
        cy.task('stubAppointmentCompliedWithFutureDate')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      describe('Appointment in future with outcome recorded', () => {
        it('Should not display Reschedule link', () => {
          manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Date and time')
          manageAppointmentPage
            .getAppointmentDetailsListItem(index, 'value')
            .should('contain.text', '21 February 2034 at 10:15am to 10:30am')
          manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
        })
      })
    })

    describe('Appointment in future with no outcome recorded', () => {
      const name = 'Log appointment outcome'
      beforeEach(() => {
        cy.task('stubAppointmentNonCompliedWithFutureDate')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      describe('Appointment in future with no outcome recorded', () => {
        it('should display the reschedule link ', () => {
          manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Date and time')
          manageAppointmentPage
            .getAppointmentDetailsListItem(index, 'value')
            .should('contain.text', '21 February 2034 at 10:15am to 10:30am')
          manageAppointmentPage
            .getAppointmentDetailsListItem(index, 'actions')
            .find('a')
            .should('contain.text', 'Reschedule')
            .should('have.attr', 'href', `/case/X778160/appointment/6/reschedule`)
            .click()
          const rescheduleAppointmentPage = new RescheduleAppointmentPage()
          rescheduleAppointmentPage.checkOnPage()
        })
      })
    })

    describe('Appointment in past with outcome recorded', () => {
      const name = 'Log appointment outcome'
      beforeEach(() => {
        cy.task('stubAppointmentCompliedWithPastDate')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      describe('Appointment in past with outcome recorded', () => {
        it('Should not display Reschedule link', () => {
          manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Date and time')
          manageAppointmentPage
            .getAppointmentDetailsListItem(index, 'value')
            .should('contain.text', '21 February 2024 at 10:15am to 10:30am')
          manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
        })
      })
    })

    describe('Appointment in past with no outcome recorded', () => {
      const name = 'Log appointment outcome'
      beforeEach(() => {
        cy.task('stubAppointmentNonCompliedWithPastDate')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      describe('Non complied appointment is in the past', () => {
        it('should display the reschedule link ', () => {
          manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Date and time')
          manageAppointmentPage
            .getAppointmentDetailsListItem(index, 'value')
            .should('contain.text', '21 February 2024 at 10:15am to 10:30am')
          manageAppointmentPage
            .getAppointmentDetailsListItem(index, 'actions')
            .find('a')
            .should('contain.text', 'Reschedule')
            .should('have.attr', 'href', `/case/X778160/appointment/6/reschedule`)
            .click()
          const rescheduleAppointmentPage = new RescheduleAppointmentPage()
          rescheduleAppointmentPage.checkOnPage()
        })
      })
    })
  })
}
