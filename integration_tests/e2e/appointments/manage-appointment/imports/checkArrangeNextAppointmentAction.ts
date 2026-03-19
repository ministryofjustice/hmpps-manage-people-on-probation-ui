import ManageAppointmentPage from '../../../../pages/appointments/manage-appointment.page'
import { loadPage } from './common'

export const checkArrangeNextAppointmentAction = () => {
  let manageAppointmentPage: ManageAppointmentPage
  describe('Arrange next appointment', () => {
    const name = 'Arrange next appointment'
    describe('Logged in user is COM', () => {
      describe('Appointment is in future with no next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeNoNotes')
          cy.task('stubIsComNoNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage
            .getTaskLink(3)
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
            .getTaskHint(3)
            .should('contain.text', 'You do not have any other appointments arranged with Eula.')
        })
        it(`should display the status tag as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in future with next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeNoNotes')
          cy.task('stubIsComNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(3).should('contain.text', name)
        })
        it('should not display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('not.exist')
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at The Building on 21 February 2024.')
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in the future with next appointment arranged at POP home address', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeNoNotes')
          cy.task('stubIsComNextAppointmentAtHome')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at their home on 21 February 2024.')
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in past with no next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentOutcomeNoNotes')
          cy.task('stubIsComNoNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage
            .getTaskLink(3)
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
            .getTaskHint(3)
            .should('contain.text', 'You do not have any other appointments arranged with Eula.')
        })
        it(`should display the status tag as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in past with next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentOutcomeNoNotes')
          cy.task('stubIsComNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(3).should('contain.text', name)
        })
        it('should not display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('not.exist')
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at The Building on 21 February 2024.')
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in the past with next appointment arranged at POP home address', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentOutcomeNoNotes')
          cy.task('stubIsComNextAppointmentAtHome')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at their home on 21 February 2024.')
        })
      })
    })
    describe('Logged in user is not COM', () => {
      describe('Appointment is in future with no next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeNoNotes')
          cy.task('stubNotComNoNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage
            .getTaskLink(3)
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
            .getTaskHint(3)
            .should('contain.text', 'Terry does not have any other appointments arranged with Eula.')
        })
        it(`should display the status tag as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in future with next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeNoNotes')
          cy.task('stubNotComNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(3).should('contain.text', name)
        })
        it('should not display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('not.exist')
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at The Building on 21 February 2024.')
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in future with next appointment arranged at POP home address', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeNoNotes')
          cy.task('stubNotComNextAppointmentAtHome')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(3).should('contain.text', name)
        })
        it('should not display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('not.exist')
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at their home on 21 February 2024.')
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in past with no next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentOutcomeNoNotes')
          cy.task('stubNotComNoNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage
            .getTaskLink(3)
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
            .getTaskHint(3)
            .should('contain.text', 'Terry does not have any other appointments arranged with Eula.')
        })
        it(`should display the status tag as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in past with next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentOutcomeNoNotes')
          cy.task('stubNotComNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(3).should('contain.text', name)
        })
        it('should not display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('not.exist')
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at The Building on 21 February 2024.')
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is sensitive', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentSensitive')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the sensitive tag', () => {
          manageAppointmentPage.getSensitiveTag().should('contain.text', 'Sensitive')
        })
      })
      describe('Appointment is in the past with next appointment arranged at POP home address', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentOutcomeNoNotes')
          cy.task('stubNotComNextAppointmentAtHome')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(3).should('contain.text', name)
        })
        it('should not display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('not.exist')
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at their home on 21 February 2024.')
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
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
        manageAppointmentPage.getTaskLink(3).should('not.exist')
      })
    })
  })
}
