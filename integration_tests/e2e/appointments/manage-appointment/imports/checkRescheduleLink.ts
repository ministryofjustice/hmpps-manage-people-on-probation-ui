import ManageAppointmentPage from '../../../../pages/appointments/manage-appointment.page'
import RescheduleAppointmentPage from '../../../../pages/appointments/reschedule-appointment.page'
import { loadPage } from './common'

export const checkRescheduleLink = () => {
  let manageAppointmentPage: ManageAppointmentPage
  describe('Appointment Reschedule link', () => {
    beforeEach(() => {
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })

    describe('Complied appointment with future date', () => {
      const name = 'Log attended and complied appointment'
      beforeEach(() => {
        cy.task('stubAppointmentCompliedWithFutureDate')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      describe('Appointment in future with outcome recorded', () => {
        it('Should not display Reschedule link', () => {
          manageAppointmentPage.getTaskName(1).should('contain.text', name)
          manageAppointmentPage.getAppointmentDetailsListItem(1, 'key').should('contain.text', 'Date and time')
          manageAppointmentPage
            .getAppointmentDetailsListItem(1, 'value')
            .should('contain.text', '21 February 2034 at 10:15am to 10:30am')
          manageAppointmentPage.getAppointmentDetailsListItem(1, 'actions').should('not.exist')
        })
      })
    })

    describe('Appointment in future with no outcome recorded', () => {
      const name = 'Log attended and complied appointment'
      beforeEach(() => {
        cy.task('stubAppointmentNonCompliedWithFutureDate')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      describe('Appointment in future with no outcome recorded', () => {
        it('should display the reschedule link ', () => {
          manageAppointmentPage.getTaskName(1).should('contain.text', name)
          manageAppointmentPage.getAppointmentDetailsListItem(1, 'key').should('contain.text', 'Date and time')
          manageAppointmentPage
            .getAppointmentDetailsListItem(1, 'value')
            .should('contain.text', '21 February 2034 at 10:15am to 10:30am')
          manageAppointmentPage
            .getAppointmentDetailsListItem(1, 'actions')
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
      const name = 'Log attended and complied appointment'
      beforeEach(() => {
        cy.task('stubAppointmentCompliedWithPastDate')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      describe('Appointment in past with outcome recorded', () => {
        it('Should not display Reschedule link', () => {
          manageAppointmentPage.getTaskName(1).should('contain.text', name)
          manageAppointmentPage.getAppointmentDetailsListItem(1, 'key').should('contain.text', 'Date and time')
          manageAppointmentPage
            .getAppointmentDetailsListItem(1, 'value')
            .should('contain.text', '21 February 2024 at 10:15am to 10:30am')
          manageAppointmentPage.getAppointmentDetailsListItem(1, 'actions').should('not.exist')
        })
      })
    })

    describe('Appointment in past with no outcome recorded', () => {
      const name = 'Log attended and complied appointment'
      beforeEach(() => {
        cy.task('stubAppointmentNonCompliedWithPastDate')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      describe('Non complied appointment is in the past', () => {
        it('should display the reschedule link ', () => {
          manageAppointmentPage.getTaskName(1).should('contain.text', name)
          manageAppointmentPage.getAppointmentDetailsListItem(1, 'key').should('contain.text', 'Date and time')
          manageAppointmentPage
            .getAppointmentDetailsListItem(1, 'value')
            .should('contain.text', '21 February 2024 at 10:15am to 10:30am')
          manageAppointmentPage
            .getAppointmentDetailsListItem(1, 'actions')
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
