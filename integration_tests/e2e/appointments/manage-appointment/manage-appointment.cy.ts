import ManageAppointmentPage from '../../../pages/appointments/manage-appointment.page'
import {
  checkAppointmentDetails,
  checkAppointmentNotesAction,
  checkUploadDocumentsAction,
  checkArrangeNextAppointmentAction,
  checkAlertBanner,
  checkRescheduleLink,
  checkLogOutcomeAction,
} from './imports'
import { crn, appointmentId, loadPage } from './imports/common'

let manageAppointmentPage: ManageAppointmentPage

const appointmentActions = (enableNonCompliance = true) => {
  checkLogOutcomeAction(enableNonCompliance)
  checkAppointmentNotesAction()
  if (enableNonCompliance) {
    checkUploadDocumentsAction()
  }
  checkArrangeNextAppointmentAction(enableNonCompliance)
}

const appointmentDetails = (enableNonCompliance = true) => {
  describe('MPOP managed appointment', () => {
    checkAppointmentDetails({ deliusManaged: false, enableNonCompliance })
  })

  describe('Delius managed appointment type, no outcome', () => {
    beforeEach(() => {
      cy.task('stubAppointment', { deliusManaged: true, hasOutcome: false })
      loadPage()
    })
    checkAppointmentDetails({
      deliusManaged: true,
      hasOutcome: false,
      enableNonCompliance,
    })
  })
  describe('Delius managed appointment type, complied', () => {
    beforeEach(() => {
      cy.task('stubAppointment', { deliusManaged: true, hasOutcome: true, hasComplied: true })
      loadPage()
    })
    checkAppointmentDetails({
      deliusManaged: true,
      hasComplied: true,
      hasOutcome: true,
      enableNonCompliance,
    })
  })
  describe('Delius managed appointment, acceptable absence', () => {
    beforeEach(() => {
      cy.task('stubAppointment', { deliusManaged: true, hasOutcome: true, acceptableAbsence: true })
      loadPage()
    })
    checkAppointmentDetails({
      deliusManaged: true,
      hasComplied: false,
      acceptableAbsence: true,
      hasOutcome: true,
      enableNonCompliance,
    })
  })
  describe('Delius managed appointment, unacceptable absence', () => {
    beforeEach(() => {
      cy.task('stubAppointment', { deliusManaged: true, hasOutcome: true, acceptableAbsence: false })
      loadPage()
    })
    checkAppointmentDetails({
      deliusManaged: true,
      hasComplied: false,
      acceptableAbsence: false,
      hasOutcome: true,
      enableNonCompliance,
    })
  })
}

describe('Manage an appointment', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  it('should render the page', () => {
    loadPage()
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getBackLink().should('have.attr', 'href', `/case/${crn}/appointments`)
    manageAppointmentPage.checkPageTitle('Manage planned office visit (NS) with Terry Jones')
    manageAppointmentPage.getLastUpdated().should('contain.text', 'Last updated by Paul Smith on 20 March 2023')
    manageAppointmentPage.getRelatedContacts().should('contain.text', 'Related contacts')
  })

  describe('Alert banner', () => {
    checkAlertBanner()
  })

  describe('Appointment actions', () => {
    it('should display the section title', () => {
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
      manageAppointmentPage.getAppointmentActions().find('h3').should('contain.text', 'Appointment actions')
    })
    it('should display the inset text and NDelius link', () => {
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
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
    describe('enableNonCompliance feature flag is enabled', () => {
      beforeEach(() => {
        loadPage()
      })
      appointmentActions()
    })
    describe('enableNonCompliance feature flag is disabled', () => {
      beforeEach(() => {
        cy.task('stubDisableNonCompliance')
        loadPage()
      })
      appointmentActions(false)
    })
    describe('Appointment type is NDelius managed', () => {
      beforeEach(() => {
        cy.task('stubAppointment', { deliusManaged: true })
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should not display the appointment actions', () => {
        manageAppointmentPage.getAppointmentActions().should('not.exist')
      })
    })
  })

  describe('Appointment details', () => {
    it('should display the section title', () => {
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
      manageAppointmentPage.getAppointmentDetails().find('h3').should('contain.text', 'Appointment details')
    })
    describe('enableNonCompliance feature flag is enabled', () => {
      beforeEach(() => {
        loadPage()
      })
      appointmentDetails()
      checkRescheduleLink()
    })
    describe('enableNonCompliance feature flag is disabled', () => {
      beforeEach(() => {
        cy.task('stubDisableNonCompliance')
        loadPage()
      })
      appointmentDetails(false)
      checkRescheduleLink(false)
    })
    describe('enableDeepLinks feature flag is enabled', () => {
      describe('drug test appointment type', () => {
        beforeEach(() => {
          cy.task('stubEnableDeepLinks')
          cy.task('stubAppointment', { deliusManaged: true, contactType: 'Drug Test Appointment (NS)' })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the drug history deep link with correct wording', () => {
          manageAppointmentPage
            .getAppointmentDetails()
            .find('.govuk-body')
            .should('contain.text', 'You can manage this appointment through the')
          manageAppointmentPage
            .getAppointmentDetails()
            .find('.govuk-body a')
            .should('contain.text', 'drug history in NDelius (opens in a new tab)')
            .should('have.attr', 'target', '_blank')
            .should(
              'have.attr',
              'href',
              `https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=DrugHistory&CRN=${crn}&EventNumber=7654321`,
            )
        })
      })
      describe('CP/UPW appointment type', () => {
        beforeEach(() => {
          cy.task('stubEnableDeepLinks')
          cy.task('stubAppointment', { deliusManaged: true, contactType: 'CP/UPW - Appointment/Attendance (NS)' })
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the UPW worksheet deep link with correct wording', () => {
          manageAppointmentPage
            .getAppointmentDetails()
            .find('.govuk-body')
            .should('contain.text', 'You can manage this appointment through the')
          manageAppointmentPage
            .getAppointmentDetails()
            .find('.govuk-body a')
            .should('contain.text', 'unpaid work worksheet summary in NDelius (opens in a new tab)')
            .should('have.attr', 'target', '_blank')
            .should(
              'have.attr',
              'href',
              `https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UPWWorksheet&CRN=${crn}&EventNumber=7654321`,
            )
        })
      })
    })
  })

  describe('Related contacts', () => {
    it('should display related contacts section with related contact details', () => {
      loadPage()

      manageAppointmentPage = new ManageAppointmentPage()

      manageAppointmentPage.getRelatedContacts().find('h3').should('contain.text', 'Related contacts')

      manageAppointmentPage
        .getRelatedContacts()
        .find('li')
        .eq(0)
        .should('contain.text', 'Breach Action - Breach Letter Sent')
        .and('contain.text', 'Created by J.Frost')
        .and('contain.text', '12 May 2026')

      manageAppointmentPage
        .getRelatedContacts()
        .find('li')
        .eq(1)
        .should('contain.text', 'First warning letter sent')
        .and('contain.text', 'Created by T.Morris')
        .and('contain.text', '19 May 2026')

      manageAppointmentPage
        .getRelatedContacts()
        .find('li')
        .eq(2)
        .should('contain.text', 'First warning letter requested')
        .and('contain.text', 'Created by J.Smith')
        .and('contain.text', '16 May 2026')
    })
  })
})
