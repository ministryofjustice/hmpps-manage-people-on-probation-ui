import ManageAppointmentPage from '../../../../pages/appointments/manage-appointment.page'
import { loadPage } from './common'

export const checkArrangeNextAppointmentAction = (enableNonCompliance = true) => {
  let manageAppointmentPage: ManageAppointmentPage
  describe('Arrange next appointment action', () => {
    const name = 'Arrange next appointment'
    const index = enableNonCompliance ? 4 : 3
    describe('Logged in user is COM', () => {
      describe('Appointment is in future with no next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: true, deliusManaged: false, notes: false })
          cy.task('stubIsComNoNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage
            .getTaskLink(index)
            .should('contain.text', name)
            .should(
              'have.attr',
              'href',
              `/case/X778160/appointments/appointment/6/next-appointment?back=${encodeURIComponent(
                '/case/X778160/appointments/appointment/6/manage',
              )}`,
            )
        })
        it('should display the hint text', () => {
          manageAppointmentPage
            .getTaskHint(index)
            .should('contain.text', 'You do not have any other appointments arranged with Eula.')
        })
        it(`should display the status tag as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(index)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in future with next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: true, deliusManaged: false, notes: false })
          cy.task('stubIsComNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(index).should('contain.text', name)
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage
            .getTaskLink(index)
            .should('contain.text', name)
            .should(
              'have.attr',
              'href',
              `/case/X778160/appointments/appointment/6/next-appointment?back=${encodeURIComponent(
                '/case/X778160/appointments/appointment/6/manage',
              )}`,
            )
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(index)
            .should(
              'contain.text',
              'Other call arranged with Eula at The Building on Wednesday 21 February 2024 at 10:15am.',
            )
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(index)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in the future with next appointment arranged at POP home address', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: true, deliusManaged: false, notes: false })
          cy.task('stubIsComNextAppointmentAtHome')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(index)
            .should(
              'contain.text',
              'Other call arranged with Eula at their home on Wednesday 21 February 2024 at 10:15am.',
            )
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(index)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in past with no next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: false,
            deliusManaged: false,
            hasOutcome: true,
            hasComplied: true,
            notes: false,
          })
          cy.task('stubIsComNoNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage
            .getTaskLink(index)
            .should('contain.text', name)
            .should(
              'have.attr',
              'href',
              `/case/X778160/appointments/appointment/6/next-appointment?back=${encodeURIComponent(
                '/case/X778160/appointments/appointment/6/manage',
              )}`,
            )
        })
        it('should display the hint text', () => {
          manageAppointmentPage
            .getTaskHint(index)
            .should('contain.text', 'You do not have any other appointments arranged with Eula.')
        })
        it(`should display the status tag as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(index)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in past with next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: false,
            deliusManaged: false,
            hasOutcome: true,
            hasComplied: true,
            notes: false,
          })
          cy.task('stubIsComNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(index).should('contain.text', name)
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage
            .getTaskLink(index)
            .should('contain.text', name)
            .should(
              'have.attr',
              'href',
              `/case/X778160/appointments/appointment/6/next-appointment?back=${encodeURIComponent(
                '/case/X778160/appointments/appointment/6/manage',
              )}`,
            )
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(index)
            .should(
              'contain.text',
              'Other call arranged with Eula at The Building on Wednesday 21 February 2024 at 10:15am.',
            )
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(index)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in the past with next appointment arranged at POP home address', () => {
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: false,
            deliusManaged: false,
            hasOutcome: true,
            hasComplied: true,
            notes: false,
          })
          cy.task('stubIsComNextAppointmentAtHome')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(index)
            .should(
              'contain.text',
              'Other call arranged with Eula at their home on Wednesday 21 February 2024 at 10:15am.',
            )
        })
      })
    })
    describe('Logged in user is not COM', () => {
      describe('Appointment is in future with no next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: false, deliusManaged: false, notes: false })
          cy.task('stubNotComNoNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage
            .getTaskLink(index)
            .should('contain.text', name)
            .should(
              'have.attr',
              'href',
              `/case/X778160/appointments/appointment/6/next-appointment?back=${encodeURIComponent(
                '/case/X778160/appointments/appointment/6/manage',
              )}`,
            )
        })
        it('should display the hint text', () => {
          manageAppointmentPage
            .getTaskHint(index)
            .should('contain.text', 'Terry does not have any other appointments arranged with Eula.')
        })
        it(`should display the status tag as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(index)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in future with next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: true, deliusManaged: false, notes: false })
          cy.task('stubNotComNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(index).should('contain.text', name)
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage
            .getTaskLink(index)
            .should('contain.text', name)
            .should(
              'have.attr',
              'href',
              `/case/X778160/appointments/appointment/6/next-appointment?back=${encodeURIComponent(
                '/case/X778160/appointments/appointment/6/manage',
              )}`,
            )
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(index)
            .should(
              'contain.text',
              'Other call arranged with Eula at The Building on Wednesday 21 February 2024 at 10:15am.',
            )
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(index)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in future with next appointment arranged at POP home address', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: true, deliusManaged: false, notes: false })
          cy.task('stubNotComNextAppointmentAtHome')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(index).should('contain.text', name)
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage
            .getTaskLink(index)
            .should('contain.text', name)
            .should(
              'have.attr',
              'href',
              `/case/X778160/appointments/appointment/6/next-appointment?back=${encodeURIComponent(
                '/case/X778160/appointments/appointment/6/manage',
              )}`,
            )
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(index)
            .should(
              'contain.text',
              'Other call arranged with Eula at their home on Wednesday 21 February 2024 at 10:15am.',
            )
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(index)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in past with no next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: false,
            deliusManaged: false,
            hasOutcome: true,
            hasComplied: true,
            notes: false,
          })
          cy.task('stubNotComNoNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage
            .getTaskLink(index)
            .should('contain.text', name)
            .should(
              'have.attr',
              'href',
              `/case/X778160/appointments/appointment/6/next-appointment?back=${encodeURIComponent(
                '/case/X778160/appointments/appointment/6/manage',
              )}`,
            )
        })
        it('should display the hint text', () => {
          manageAppointmentPage
            .getTaskHint(index)
            .should('contain.text', 'Terry does not have any other appointments arranged with Eula.')
        })
        it(`should display the status tag as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(index)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in past with next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: false,
            deliusManaged: false,
            hasOutcome: true,
            hasComplied: true,
            notes: false,
          })
          cy.task('stubNotComNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(index).should('contain.text', name)
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage
            .getTaskLink(index)
            .should('contain.text', name)
            .should(
              'have.attr',
              'href',
              `/case/X778160/appointments/appointment/6/next-appointment?back=${encodeURIComponent(
                '/case/X778160/appointments/appointment/6/manage',
              )}`,
            )
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(index)
            .should(
              'contain.text',
              'Other call arranged with Eula at The Building on Wednesday 21 February 2024 at 10:15am.',
            )
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(index)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is sensitive', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: false, deliusManaged: false, isSensitive: true })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the sensitive tag', () => {
          manageAppointmentPage.getSensitiveTag().should('contain.text', 'Sensitive')
        })
      })
      describe('Appointment is in the past with next appointment arranged at POP home address', () => {
        beforeEach(() => {
          cy.task('stubAppointment', {
            isFuture: false,
            deliusManaged: false,
            hasOutcome: true,
            hasComplied: true,
            notes: false,
          })
          cy.task('stubNotComNextAppointmentAtHome')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(index).should('contain.text', name)
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage
            .getTaskLink(index)
            .should('contain.text', name)
            .should(
              'have.attr',
              'href',
              `/case/X778160/appointments/appointment/6/next-appointment?back=${encodeURIComponent(
                '/case/X778160/appointments/appointment/6/manage',
              )}`,
            )
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(index)
            .should(
              'contain.text',
              'Other call arranged with Eula at their home on Wednesday 21 February 2024 at 10:15am.',
            )
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(index)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
    })
    describe('POP has deceased', () => {
      beforeEach(() => {
        cy.task('stubPersonalDetailsDateOfDeathManage')
        loadPage()
      })
      it('should not display a link to arrange next appointment', () => {
        manageAppointmentPage.getTaskLink(index).should('not.exist')
      })
    })
  })
}
