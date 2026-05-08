import ManageAppointmentPage from '../../../../pages/appointments/manage-appointment.page'
import { loadPage, crn, appointmentId } from './common'

export const checkLogOutcomeAction = (enableNonCompliance = true) => {
  describe('Log appointment outcome action', () => {
    const name = enableNonCompliance ? 'Log appointment outcome' : 'Log attended and complied appointment'
    const changeLabel = 'Change appointment outcome'
    let manageAppointmentPage = new ManageAppointmentPage()
    if (enableNonCompliance) {
      it('should not display the hint text', () => {
        manageAppointmentPage.getTaskHint(1).should('not.exist')
      })
      describe('Appointment is in the future with no outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: true, hasOutcome: false })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to log the outcome', () => {
          manageAppointmentPage
            .getTaskLink(1)
            .should('contain.text', name)
            .should('have.attr', 'href', `/case/${crn}/appointments/appointment/${appointmentId}/outcome`)
        })
      })
      describe('Appointment is in the future with outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: true, hasOutcome: true, hasComplied: true })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        if (enableNonCompliance) {
          it('should display a link the change the outcome', () => {
            manageAppointmentPage.getTaskLink(1).should('contain.text', changeLabel)
            manageAppointmentPage
              .getTaskLink(1)
              .should(
                'have.attr',
                'href',
                `/case/${crn}/appointments/appointment/${appointmentId}/outcome/update-enforcement-action`,
              )
          })
        } else {
          it('should not display a link to log the outcome', () => {
            manageAppointmentPage.getTaskLink(1).should('not.exist')
            manageAppointmentPage.getTaskName(1).should('contain.text', name)
          })
        }
        it(`should display the status as 'Complied'`, () => {
          manageAppointmentPage
            .getTaskStatus(1)
            .should('contain.html', 'class="govuk-tag govuk-tag--green"')
            .should('contain.text', 'Complied')
        })
      })
      describe('Appointment is in the past, with no outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: false, hasOutcome: false })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to log the outcome', () => {
          manageAppointmentPage
            .getTaskLink(1)
            .should('contain.text', name)
            .should('have.attr', 'href', `/case/${crn}/appointments/appointment/${appointmentId}/outcome`)
        })
        it(`should display the status as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(1)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in the past, with outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: false, hasOutcome: true, hasComplied: true, notes: false })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        if (enableNonCompliance) {
          it('should display the change outcome link', () => {
            manageAppointmentPage.getTaskLink(1).should('contain.text', changeLabel)
            manageAppointmentPage
              .getTaskLink(1)
              .should(
                'have.attr',
                'href',
                `/case/${crn}/appointments/appointment/${appointmentId}/outcome/update-enforcement-action`,
              )
          })
        } else {
          it('should display the task name', () => {
            manageAppointmentPage.getTaskName(1).should('contain.text', name)
          })
          it('should not display a link to log the outcome', () => {
            manageAppointmentPage.getTaskLink(1).should('not.exist')
          })
        }
        it(`should display the status as 'Complied'`, () => {
          manageAppointmentPage
            .getTaskStatus(1)
            .should('contain.html', 'class="govuk-tag govuk-tag--green"')
            .should('contain.text', 'Complied')
        })
      })
    }
    if (!enableNonCompliance) {
      describe('Appointment is in the future with no outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: true, hasOutcome: false })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(1).should('contain.text', name)
        })
        it('should display the hint text', () => {
          manageAppointmentPage
            .getTaskHint(1)
            .should(
              'contain.text',
              'You cannot log an attended and complied outcome until the appointment has happened',
            )
        })
        it('should not display a link to log the outcome', () => {
          manageAppointmentPage.getTaskLink(1).should('not.exist')
        })
      })
      describe('Appointment is in the past, with no outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: false, hasOutcome: false, notes: false })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to log the outcome', () => {
          manageAppointmentPage
            .getTaskLink(1)
            .should('contain.text', name)
            .should('have.attr', 'href', `/case/${crn}/appointments/appointment/${appointmentId}/attended-complied`)
        })
        it('should not display the hint text', () => {
          manageAppointmentPage.getTaskHint(1).should('not.exist')
        })
        it(`should display the status as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(1)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in the past, with outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: false, hasOutcome: true, hasComplied: true })
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
    }
  })
}
