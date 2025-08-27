import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import { checkAppointmentDetails } from './imports'

const crn = 'X778160'
const appointmentId = '6'

const loadPage = () => {
  cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
}

describe('Manage an appointment', () => {
  let manageAppointmentPage: ManageAppointmentPage
  beforeEach(() => {
    cy.task('resetMocks')
    loadPage()
    manageAppointmentPage = new ManageAppointmentPage()
  })
  it('should render the page', () => {
    manageAppointmentPage.setPageTitle('Manage Planned Office Visit (NS) with Terry Jones')
    manageAppointmentPage.getLastUpdated().should('contain.text', 'Last updated by Paul Smith on 20 March 2023')
  })
  describe('Alert banner', () => {
    describe('Appointment is in the future', () => {
      beforeEach(() => {
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should not show the alert', () => {
        manageAppointmentPage.getAlertBanner().should('not.exist')
      })
    })
    describe('Appointment is in the past', () => {
      describe('Outcome not logged and no notes', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentNoOutcomeNoNotes')
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
          cy.task('stubPastAppointmentOutcomeNoNotes')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the alert banner with the correct message', () => {
          manageAppointmentPage.getAlertBanner().should('contain.text', 'You should add notes to this appointment.')
        })
      })
    })
  })

  describe('Appointment with no documents', () => {
    beforeEach(() => {
      cy.task('stubFutureAppointmentManagedTypeWithNotes')
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })
    it('should render the page without associated documents', () => {
      manageAppointmentPage.getAssociatedDocuments().should('not.exist')
    })
  })

  describe('Appointment actions', () => {
    beforeEach(() => {
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })
    it('should display the section title', () => {
      manageAppointmentPage.getAppointmentActions().find('h3').should('contain.text', 'Appointment actions')
    })
    it('should display the inset text and MDelius link', () => {
      manageAppointmentPage.getAppointmentActions().find('.govuk-inset-text').should('contain.text', 'You must')
      manageAppointmentPage
        .getAppointmentActions()
        .find('.govuk-inset-text a')
        .should('contain.text', 'use NDelius to log non-attendance or non-compliance (opens in new tab)')
        .should('have.attr', 'target', '_blank')
        .should(
          'have.attr',
          'href',
          `https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=${crn}&contactID=${appointmentId}`,
        )
    })

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
            .should(
              'contain.text',
              'You cannot log an attended and complied outcome until the appointment has happened',
            )
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
            .should('have.attr', 'href', `/case/${crn}/appointments/appointment/${appointmentId}/record-an-outcome`)
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
  })

  describe('Appointment type is NDelius managed', () => {
    beforeEach(() => {
      cy.task('stubAppointmentNDeliusManagedType')
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })
    it('should not display the appointment actions', () => {
      manageAppointmentPage.getAppointmentActions().should('not.exist')
    })
  })

  describe('Add appointment notes', () => {
    const name = 'Add appointment notes'
    describe('Appointment in future and has no notes', () => {
      beforeEach(() => {
        cy.task('stubFutureAppointmentManagedTypeNoNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to add appointment notes', () => {
        manageAppointmentPage.getTaskLink(2).should('contain.text', name).should('have.attr', 'href', '#')
      })
      it(`should display the status tag as 'Not started'`, () => {
        manageAppointmentPage
          .getTaskStatus(2)
          .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
          .should('contain.text', 'Not started')
      })
    })
    describe('Appointment in future and has notes', () => {
      beforeEach(() => {
        cy.task('stubFutureAppointmentManagedTypeWithNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to add appointment notes', () => {
        manageAppointmentPage.getTaskLink(2).should('contain.text', name).should('have.attr', 'href', '#')
      })
      it(`should display the status tag as 'In progress'`, () => {
        manageAppointmentPage
          .getTaskStatus(2)
          .should('contain.html', 'class="govuk-tag govuk-tag--yellow"')
          .should('contain.text', 'In progress')
      })
    })
    describe('Appointment in past and has no notes', () => {
      beforeEach(() => {
        cy.task('stubPastAppointmentNoOutcomeNoNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to add appointment notes', () => {
        manageAppointmentPage.getTaskLink(2).should('contain.text', name).should('have.attr', 'href', '#')
      })
      it(`should display the status tag as 'Not started'`, () => {
        manageAppointmentPage
          .getTaskStatus(2)
          .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
          .should('contain.text', 'Not started')
      })
    })
    describe('Appointment in past and has notes', () => {
      beforeEach(() => {
        cy.task('stubPastAppointmentWithNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to add appointment notes', () => {
        manageAppointmentPage.getTaskLink(2).should('contain.text', name).should('have.attr', 'href', '#')
      })
      it(`should display the status as 'Completed'`, () => {
        manageAppointmentPage
          .getTaskStatus(2)
          .should('not.contain.html', 'class="govuk-tag')
          .should('contain.text', 'Completed')
      })
    })
  })
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
          manageAppointmentPage.getTaskLink(3).should('contain.text', name).should('have.attr', 'href', '#')
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
          manageAppointmentPage.getTaskLink(3).should('contain.text', name).should('have.attr', 'href', '#')
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
          manageAppointmentPage.getTaskLink(3).should('contain.text', name).should('have.attr', 'href', '#')
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
          manageAppointmentPage.getTaskLink(3).should('contain.text', name).should('have.attr', 'href', '#')
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
  })
  describe('Appointment details', () => {
    beforeEach(() => {
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })
    it('should display the section title', () => {
      manageAppointmentPage.getAppointmentDetails().find('h3').should('contain.text', 'Appointment details')
    })
    describe('MPOP managed appointment', () => {
      checkAppointmentDetails()
    })
    describe('Delius managed appointment type, no outcome', () => {
      beforeEach(() => {
        cy.task('stubAppointmentNDeliusManagedType')
        loadPage()
      })
      checkAppointmentDetails({
        task: 'stubAppointmentNDeliusManagedType',
        noNotesTask: 'stubAppointmentNDeliusManagedTypeNoNotesNoOutcome',
        withNotesTask: 'stubAppointmentNDeliusManagedTypeWithNotesNoOutcome',
        deliusManagedType: true,
      })
    })
    describe('Delius managed appointment type, complied', () => {
      beforeEach(() => {
        cy.task('stubAppointmentNDeliusManagedTypeComplied')
        loadPage()
      })
      checkAppointmentDetails({
        task: 'stubAppointmentNDeliusManagedTypeComplied',
        noNotesTask: 'stubAppointmentNDeliusManagedTypeNoNotesHasOutcome',
        withNotesTask: 'stubAppointmentNDeliusManagedTypeWithNotesHasOutcome',
        deliusManagedType: true,
        hasComplied: true,
      })
    })
    describe('Delius managed appointment, unacceptable absence', () => {
      beforeEach(() => {
        cy.task('stubAppointmentUnacceptableAbsenceNoNotes')
        loadPage()
      })
      checkAppointmentDetails({
        task: 'stubAppointmentUnacceptableAbsenceNoNotes',
        noNotesTask: 'stubAppointmentUnacceptableAbsenceNoNotes',
        withNotesTask: 'stubAppointmentUnacceptableAbsenceWithNotes',
        deliusManagedType: true,
        hasComplied: false,
        notCompliedAbsence: true,
      })
    })
  })

  describe('Associated documents', () => {
    beforeEach(() => {
      cy.task('stubFutureAppointmentManagedTypeWithDocs')
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })
    it('should display the associated documents section', () => {
      manageAppointmentPage.getAssociatedDocuments().find('h3').should('contain.text', 'Associated documents')
      manageAppointmentPage
        .getAssociatedDocuments()
        .find('p.govuk-body')
        .should('contain.text', 'Documents associated with this appointment')
      manageAppointmentPage.getAssociatedDocumentsTableColumnHeading(1).should('contain.text', 'Name')
      manageAppointmentPage.getAssociatedDocumentsTableColumnHeading(2).should('contain.text', 'Level')
      manageAppointmentPage.getAssociatedDocumentsTableColumnHeading(3).should('contain.text', 'Type')
      manageAppointmentPage.getAssociatedDocumentsTableColumnHeading(4).should('contain.text', 'Date created')
      manageAppointmentPage.getAssociatedDocumentsTableColumnHeading(5).should('contain.text', 'Date modified')
      manageAppointmentPage.getAssociatedDocumentsTableRows().should('have.length', 3)
      manageAppointmentPage
        .getAssociatedDocumentsTableRowCell(1, 1)
        .find('a')
        .should('contain.text', 'Document-1.pdf')
        .should('have.attr', 'href', 'personal-details/documents/83fdbf8a-a2f2-43b4-93ef-67e71c04fc58/download')
      manageAppointmentPage.getAssociatedDocumentsTableRowCell(1, 2).should('contain.text', 'Contact')
      manageAppointmentPage.getAssociatedDocumentsTableRowCell(1, 3).should('contain.text', '3 Way Meeting (NS)')
      manageAppointmentPage.getAssociatedDocumentsTableRowCell(1, 4).should('contain.text', '6 April 2023')
      manageAppointmentPage.getAssociatedDocumentsTableRowCell(1, 5).should('contain.text', '6 April 2023')
    })
  })
})
