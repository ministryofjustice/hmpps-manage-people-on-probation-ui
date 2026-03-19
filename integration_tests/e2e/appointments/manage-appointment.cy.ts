import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import { appointmentId, crn } from './imports/common'
import {
  checkAppointmentDetails,
  checkAppointmentNotesAction,
  checkArrangeNextAppointmentAction,
  checkLogOutcomeAction,
  checkRescheduleLink,
} from './manage-appointment/imports'

const loadPage = () => {
  cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
}

describe('Manage an appointment', () => {
  let manageAppointmentPage: ManageAppointmentPage
  beforeEach(() => {
    cy.task('resetMocks')
  })
  it('should render the page', () => {
    loadPage()
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getBackLink().should('have.attr', 'href', `/case/${crn}/appointments`)
    manageAppointmentPage.checkPageTitle('Manage planned office visit (NS) with Terry Jones')
    manageAppointmentPage.getLastUpdated().should('contain.text', 'Last updated by Paul Smith on 20 March 2023')
    manageAppointmentPage
      .getAppointmentDetailsListItem(1, 'actions')
      .find('a')
      .should('contain.text', 'Reschedule')
      .should('have.attr', 'href', `/case/X778160/appointment/6/reschedule`)
  })
  it('should render the page with no reschedule link if outcome has been logged', () => {
    cy.task('stubFutureAppointmentOutcomeHasNotes')
    loadPage()
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getAppointmentDetailsListItem(1, 'actions').should('not.exist')
  })

  describe('Alert banner', () => {
    describe('Appointment is in the future', () => {
      beforeEach(() => {
        cy.task('stubFutureAppointmentManagedTypeWithNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should not show the alert', () => {
        manageAppointmentPage.getAlertBanner().should('not.exist')
      })
    })
    describe('Appointment is NDelius managed', () => {
      beforeEach(() => {
        cy.task('stubAppointmentNDeliusManagedTypeNoNotesHasOutcome')
        loadPage()
      })
      it('should not display the alert', () => {
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
      describe('No outcome logged, has notes', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentNoOutcomeHasNotes')
          loadPage()

          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the alert banner with the correct message', () => {
          manageAppointmentPage.getAlertBanner().should('contain.text', 'You must log an outcome for this appointment.')
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
    it('should display the inset text and NDelius link', () => {
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
    checkLogOutcomeAction()
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

  checkAppointmentNotesAction()
  checkArrangeNextAppointmentAction()

  describe('Appointment details', () => {
    beforeEach(() => {
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })
    it('should display the section title', () => {
      manageAppointmentPage.getAppointmentDetails().find('h3').should('contain.text', 'Appointment details')
    })
    describe('MPOP managed appointment', () => {
      checkAppointmentDetails({ withLocationOfficeNameTask: 'stubAppointmentWithLocationOffice' })
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
        withLocationOfficeNameTask: '',
        deliusManaged: true,
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
        deliusManaged: true,
        hasComplied: true,
        hasOutcome: true,
      })
    })
    describe('Delius managed appointment, acceptable absence', () => {
      beforeEach(() => {
        cy.task('stubAppointmentAcceptableAbsenceNoNotes')
        loadPage()
      })
      checkAppointmentDetails({
        task: 'stubAppointmentAcceptableAbsenceNoNotes',
        noNotesTask: 'stubAppointmentAcceptableAbsenceNoNotes',
        withNotesTask: 'stubAppointmentAcceptableAbsenceWithNotes',
        deliusManaged: true,
        hasComplied: false,
        acceptableAbsence: true,
        hasOutcome: true,
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
        deliusManaged: true,
        hasComplied: false,
        acceptableAbsence: false,
        hasOutcome: true,
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
        .should(
          'have.attr',
          'href',
          `/case/${crn}/personal-details/documents/83fdbf8a-a2f2-43b4-93ef-67e71c04fc58/download`,
        )
      manageAppointmentPage.getAssociatedDocumentsTableRowCell(1, 2).should('contain.text', 'Contact')
      manageAppointmentPage.getAssociatedDocumentsTableRowCell(1, 3).should('contain.text', '3 Way Meeting (NS)')
      manageAppointmentPage.getAssociatedDocumentsTableRowCell(1, 4).should('contain.text', '6 April 2023')
      manageAppointmentPage.getAssociatedDocumentsTableRowCell(1, 5).should('contain.text', '6 April 2023')
    })
  })

  checkRescheduleLink()
})
