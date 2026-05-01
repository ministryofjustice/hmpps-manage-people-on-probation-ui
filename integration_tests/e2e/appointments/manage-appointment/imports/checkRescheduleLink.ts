import { DateTime } from 'luxon'
import ManageAppointmentPage from '../../../../pages/appointments/manage-appointment.page'
import RescheduleAppointmentPage from '../../../../pages/appointments/reschedule-appointment.page'
import { loadPage } from './common'

const now = DateTime.now().plus({ days: 1 })
const start = `${now.toFormat('yyyy-MM-dd')}T09:00:00+01:00`
const end = `${now.toFormat('yyyy-MM-dd')}T10:00:00+01:00`
const futureDate = now.toFormat('d MMMM yyyy')
const startTime = DateTime.fromISO(start).toFormat('ha').toLowerCase()
const endTime = DateTime.fromISO(end).toFormat('ha').toLowerCase()

export const checkRescheduleLink = (enableNonCompliance = true) => {
  let manageAppointmentPage: ManageAppointmentPage
  const index = enableNonCompliance ? 2 : 1
  describe('Appointment Reschedule link', () => {
    beforeEach(() => {
      if (enableNonCompliance) {
        cy.task('stubEnableNonCompliance')
      }
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })

    describe('Complied appointment with future date', () => {
      const name = 'Log appointment outcome'
      beforeEach(() => {
        if (enableNonCompliance) {
          cy.task('stubEnableNonCompliance')
        }
        cy.task('stubAppointment', { hasOutcome: true, hasComplied: true, isFuture: true })
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      describe('Appointment in future with outcome recorded', () => {
        it('Should not display Reschedule link', () => {
          manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Date and time')
          manageAppointmentPage
            .getAppointmentDetailsListItem(index, 'value')
            .should('contain.text', `${futureDate} at ${startTime} to ${endTime}`)
          manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
        })
      })
    })

    describe('Appointment in future with no outcome recorded', () => {
      const name = 'Log appointment outcome'
      beforeEach(() => {
        if (enableNonCompliance) {
          cy.task('stubEnableNonCompliance')
        }
        cy.task('stubAppointment', { hasOutcome: false, isFuture: true })
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      describe('Appointment in future with no outcome recorded', () => {
        it('should display the reschedule link ', () => {
          manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Date and time')
          manageAppointmentPage
            .getAppointmentDetailsListItem(index, 'value')
            .should('contain.text', `${futureDate} at ${startTime} to ${endTime}`)
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
        if (enableNonCompliance) {
          cy.task('stubEnableNonCompliance')
        }
        cy.task('stubAppointment', { hasOutcome: true, hasComplied: true, isFuture: false })
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
        if (enableNonCompliance) {
          cy.task('stubEnableNonCompliance')
        }
        cy.task('stubAppointment', { hasOutcome: false, isFuture: false })
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
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
}
