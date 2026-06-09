import { DateTime } from 'luxon'
import ManageAppointmentPage from '../../../../pages/appointments/manage-appointment.page'
import { loadPage, crn, appointmentId } from './common'

export const checkEnforcementAction = (enableNonCompliance = true) => {
  describe('Enforcement action link', () => {
    let manageAppointmentPage: ManageAppointmentPage
    if (enableNonCompliance) {
      describe('Appointment has attended and complied outcome logged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: false,
            hasOutcome: true,
            hasComplied: true,
            outcome: 'Attended - Complied',
            eventId: '2501192724',
          })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should not display a link to change the enforcement action', () => {
          manageAppointmentPage.getTaskLink(2).should('contain.text', 'Add appointment notes')
        })
      })
      describe('Appointment has failed to comply outcome and enforcement letter requested action', () => {
        const responseByDate = DateTime.now().plus({ days: 1 }).toFormat('yyyy-MM-dd')
        const formattedDate = DateTime.fromISO(responseByDate).toFormat('d MMMM')
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: false,
            hasOutcome: true,
            hasComplied: false,
            outcome: 'Attended - failed to comply',
            action: 'Enforcement letter requested',
            enforcementAction: {
              code: 'WLS',
              description: 'Enforcement letter requested',
              responseByDate,
            },
            eventId: '2501192724',
          })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the evidence due date warning', () => {
          cy.get('[data-qa=evidenceWarning]').should(
            'contain.text',
            `${formattedDate} to submit evidence (1 day remaining)`,
          )
        })
        it('should display a link to change the enforcement action', () => {
          manageAppointmentPage
            .getTaskLink(2)
            .should('contain.text', 'Change enforcement action')
            .should(
              'have.attr',
              'href',
              `/case/${crn}/appointments/appointment/${appointmentId}/outcome/update-enforcement-action`,
            )
        })
        it('should display the hint text', () => {
          manageAppointmentPage.getTaskHint(2).should('contain.text', `Evidence due date: ${formattedDate}`)
        })
        it('should display the status as Enforcement letter requested', () => {
          manageAppointmentPage
            .getTaskStatus(2)
            .should('contain.html', 'class="govuk-tag govuk-tag--yellow"')
            .should('contain.text', 'Enforcement letter requested')
        })
      })
      describe('Appointment has failed to attend outcome and refer to offender manager action with no evidence due date', () => {
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: false,
            hasOutcome: true,
            hasComplied: false,
            outcome: 'Failed To Attend',
            action: 'Refer to Offender Manager',
            enforcementAction: {
              code: 'ROM',
              description: 'Refer to Offender Manager',
              responseByDate: null,
            },
            eventId: '2501192724',
          })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should not display the evidence due date warning', () => {
          cy.get('[data-qa=evidenceWarning]').should('not.exist')
        })
        it('should display a link to change the enforcement action', () => {
          manageAppointmentPage
            .getTaskLink(2)
            .should('contain.text', 'Change enforcement action')
            .should(
              'have.attr',
              'href',
              `/case/${crn}/appointments/appointment/${appointmentId}/outcome/update-enforcement-action`,
            )
        })
        it('should not display the evidence due date hint text', () => {
          manageAppointmentPage.getTaskHint(2).should('not.exist')
        })
        it('should display the status as Refer to Offender Manager', () => {
          manageAppointmentPage
            .getTaskStatus(2)
            .should('contain.html', 'class="govuk-tag govuk-tag--purple"')
            .should('contain.text', 'Refer to Offender Manager')
        })
      })
      describe('Appointment has acceptable absence outcome', () => {
        it('should not display a link to change the enforcement action', () => {
          manageAppointmentPage.getTaskLink(2).should('contain.text', 'Add appointment notes')
        })
      })
    } else {
      it('should not display a link to change the enforcement action', () => {
        manageAppointmentPage = new ManageAppointmentPage()
        manageAppointmentPage.getTaskLink(2).should('contain.text', 'Add appointment notes')
      })
    }
  })
}
