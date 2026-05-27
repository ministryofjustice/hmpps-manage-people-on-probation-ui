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
          cy.task('stubAppointment', { isFuture: true, hasOutcome: false, eventId: '2501192724' })
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
      describe('Appointment is in the future with attended and complied outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: true,
            hasOutcome: true,
            hasComplied: true,
            wasAbsent: false,
            eventId: '2501192724',
          })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        if (enableNonCompliance) {
          it('should display a link the change the outcome', () => {
            manageAppointmentPage.getTaskLink(1).should('contain.text', changeLabel)
            manageAppointmentPage
              .getTaskLink(1)
              .should('have.attr', 'href', `/case/${crn}/appointments/appointment/${appointmentId}/outcome`)
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
      describe('Appointment is in the past, with attended and complied outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: false,
            hasOutcome: true,
            hasComplied: true,
            notes: false,
            outcome: 'Attended - complied',
            eventId: '2501192724',
          })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the change outcome link', () => {
          manageAppointmentPage.getTaskLink(1).should('contain.text', changeLabel)
          manageAppointmentPage
            .getTaskLink(1)
            .should('have.attr', 'href', `/case/${crn}/appointments/appointment/${appointmentId}/outcome`)
        })

        it(`should display the status as 'Complied'`, () => {
          manageAppointmentPage
            .getTaskStatus(1)
            .should('contain.html', 'class="govuk-tag govuk-tag--green"')
            .should('contain.text', 'Complied')
        })
      })

      describe('Appointment is in the past, with attended failed to comply outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: false,
            hasOutcome: true,
            hasComplied: false,
            wasAbsent: false,
            notes: false,
            outcome: 'Attended - Failed To Comply',
            eventId: '2501192724',
          })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the change outcome link', () => {
          manageAppointmentPage.getTaskLink(1).should('contain.text', changeLabel)
          manageAppointmentPage
            .getTaskLink(1)
            .should('have.attr', 'href', `/case/${crn}/appointments/appointment/${appointmentId}/outcome`)
        })

        it(`should display the status as 'Failed to comply'`, () => {
          manageAppointmentPage
            .getTaskStatus(1)
            .should('contain.html', 'class="govuk-tag govuk-tag--red"')
            .should('contain.text', 'Failed to comply')
        })
      })

      describe('Appointment is in the past, with failed to attend outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: false,
            hasOutcome: true,
            hasComplied: false,
            wasAbsent: true,
            notes: false,
            outcome: 'Failed to attend',
            eventId: '2501192724',
          })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the change outcome link', () => {
          manageAppointmentPage.getTaskLink(1).should('contain.text', changeLabel)
          manageAppointmentPage
            .getTaskLink(1)
            .should('have.attr', 'href', `/case/${crn}/appointments/appointment/${appointmentId}/outcome`)
        })

        it(`should display the status as 'Failed to comply'`, () => {
          manageAppointmentPage
            .getTaskStatus(1)
            .should('contain.html', 'class="govuk-tag govuk-tag--red"')
            .should('contain.text', 'Failed to comply')
        })
      })

      describe('Appointment is in the past, with acceptable absence outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: false,
            hasOutcome: true,
            hasComplied: true,
            notes: false,
            outcome: 'Acceptable absence',
            acceptableAbsence: true,
            eventId: '2501192724',
          })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the change outcome link', () => {
          manageAppointmentPage.getTaskLink(1).should('contain.text', changeLabel)
          manageAppointmentPage
            .getTaskLink(1)
            .should('have.attr', 'href', `/case/${crn}/appointments/appointment/${appointmentId}/outcome`)
        })
        it(`should display the status as 'Complied'`, () => {
          manageAppointmentPage
            .getTaskStatus(1)
            .should('contain.html', 'class="govuk-tag govuk-tag--green"')
            .should('contain.text', 'Acceptable absence')
        })
        it(`should display the hint as the absence reason`, () => {
          manageAppointmentPage.getTaskHint(1).should('contain.text', 'Holiday')
        })
      })

      describe('Appointment is in the past, with unacceptable absence outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: false,
            hasOutcome: true,
            hasComplied: false,
            notes: false,
            outcome: 'Unacceptable absence',
            acceptableAbsence: false,
            eventId: '2501192724',
          })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the change outcome link', () => {
          manageAppointmentPage.getTaskLink(1).should('contain.text', changeLabel)
          manageAppointmentPage
            .getTaskLink(1)
            .should('have.attr', 'href', `/case/${crn}/appointments/appointment/${appointmentId}/outcome`)
        })
        it(`should display the status as 'Complied'`, () => {
          manageAppointmentPage
            .getTaskStatus(1)
            .should('contain.html', 'class="govuk-tag govuk-tag--red"')
            .should('contain.text', 'Unacceptable absence')
        })
      })

      describe('Appointment is in the past, with reschedule outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: false,
            hasOutcome: true,
            hasComplied: true,
            rescheduled: true,
            notes: false,
            outcome: 'Rescheduled',
            eventId: '2501192724',
          })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the change outcome link', () => {
          manageAppointmentPage.getTaskLink(1).should('contain.text', changeLabel)
          manageAppointmentPage
            .getTaskLink(1)
            .should('have.attr', 'href', `/case/${crn}/appointments/appointment/${appointmentId}/outcome`)
        })
        it(`should display the status as 'Complied'`, () => {
          manageAppointmentPage
            .getTaskStatus(1)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Rescheduled')
        })
      })
    }
    if (!enableNonCompliance) {
      describe('Appointment is in the future with no outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: true, hasOutcome: false, eventId: '2501192724' })
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
          cy.task('stubAppointment', { isFuture: false, hasOutcome: false, notes: false, eventId: '2501192724' })
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
          cy.task('stubAppointment', { isFuture: false, hasOutcome: true, hasComplied: true, eventId: '2501192724' })
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
