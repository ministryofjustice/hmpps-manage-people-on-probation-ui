import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import IndexPage from '../../pages'
import {
  completeDateTimePage,
  completeLocationPage,
  completeRepeatingPage,
  completeSentencePage,
  completeTypePage,
  completeAttendancePage,
  completeNotePage,
  checkPopHeader,
  checkAppointmentSummary,
  checkAppointmentUpdate,
} from './imports'
import { statusErrors } from '../../../server/properties'

const loadPage = ({
  hasVisor = false,
  typeOptionIndex = 1,
  sentenceOptionIndex = 1,
  repeatAppointments = true,
  notes = true,
  sensitivity = true,
} = {}) => {
  completeTypePage(typeOptionIndex, '', hasVisor)
  completeSentencePage(sentenceOptionIndex)
  completeAttendancePage()
  completeLocationPage()
  completeDateTimePage()
  if (repeatAppointments) {
    completeRepeatingPage()
  }
  completeNotePage(notes, sensitivity)
}

describe('Check your answers then confirm the appointment', () => {
  afterEach(() => {
    cy.task('resetMocks')
  })

  it('should render the page', () => {
    loadPage()
    const cyaPage = new AppointmentCheckYourAnswersPage()
    checkPopHeader('Alton Berge', true)
    checkAppointmentSummary(cyaPage)
  })

  it('should render the page with VISOR report', () => {
    it('should display the visor report answer', () => {
      cy.task('stubOverviewVisorRegistration')
      loadPage({ hasVisor: true })
      const cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.getSummaryListRow(2).find('.govuk-summary-list__key').should('contain.text', 'VISOR report')
      cyaPage.getSummaryListRow(2).find('.govuk-summary-list__value').should('contain.text', 'Yes')
    })
  })

  it('should render the page with sentence and licence condition', () => {
    loadPage({})
    cy.get('[data-qa="appointmentSentence"]').should('contain.text', '12 month Community order')
    cy.get('[data-qa="appointmentLicenceCondition"]').should(
      'contain.text',
      'Alcohol Monitoring (Electronic Monitoring)',
    )
    cy.get('[data-qa="appointmentRequirment"]').should('not.exist')
    cy.get('[data-qa="appointmentForename"]').should('not.exist')
  })

  it('should render the page with sentence and requirment', () => {
    loadPage({ hasVisor: false, sentenceOptionIndex: 2 })
    cy.get('[data-qa="appointmentSentence"]').should('contain.text', 'ORA Community Order')
    cy.get('[data-qa="appointmentRequirement"]').should('contain.text', '12 days RAR, 1 completed')
    cy.get('[data-qa="appointmentLicenceCondition"]').should('not.exist')
    cy.get('[data-qa="appointmentForename"]').should('not.exist')
  })

  it('should render the page with sentence and nsi', () => {
    loadPage({ hasVisor: false, typeOptionIndex: 1, sentenceOptionIndex: 3 })
    cy.get('[data-qa="appointmentSentence"]').should('contain.text', 'ORA Community Order')
    cy.get('[data-qa="appointmentNsi"]').should('contain.text', 'BRE description')
  })

  it('should render the page with personal contact', () => {
    loadPage({ hasVisor: false, typeOptionIndex: 5, sentenceOptionIndex: 4 })
    cy.get('[data-qa="appointmentForename"]').should('contain.text', 'Alton')
    cy.get('[data-qa="appointmentSentence"]').should('not.exist')
    cy.get('[data-qa="appointmentRequirement"]').should('not.exist')
    cy.get('[data-qa="appointmentLicenceCondition"]').should('not.exist')
  })

  it('should render the page when repeating appointment featureflag is toggled off', () => {
    cy.task('stubNoRepeats')
    loadPage({ hasVisor: false, typeOptionIndex: 1, sentenceOptionIndex: 3, repeatAppointments: false })
    it('should not display the repeating appointment row', () => {
      cy.get('[data-qa="repeatingAppointmentLabel"]').should('not.exist')
      cy.get('[data-qa="repeatingAppointmentValue"]').should('not.exist')
    })
  })

  it('should render the page when no notes have been entered', () => {
    loadPage({ hasVisor: false, typeOptionIndex: 1, sentenceOptionIndex: 3, notes: false, sensitivity: false })
    const cyaPage = new AppointmentCheckYourAnswersPage()
    cyaPage.getSummaryListRow(7).find('.govuk-summary-list__value').should('contain.text', 'None')
  })

  describe('Change appointment values', () => {
    let cyaPage: AppointmentCheckYourAnswersPage
    beforeEach(() => {
      loadPage({})
      cyaPage = new AppointmentCheckYourAnswersPage()
    })
    checkAppointmentUpdate(cyaPage)
  })
  describe('Confirm this appointment', () => {
    let cyaPage: AppointmentCheckYourAnswersPage
    beforeEach(() => {
      loadPage()
      cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.getSubmitBtn().click()
    })
    it('should submit the appointment and redirect to the confirmation page', () => {
      const confirmPage = new AppointmentConfirmationPage()
      confirmPage.checkOnPage()
    })
  })
  describe('Duplicate appointment', () => {
    let cyaPage: AppointmentCheckYourAnswersPage
    beforeEach(() => {
      cy.task('stubAppointmentDuplicate')
      loadPage()
      cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.getSubmitBtn().click()
    })
    it('should render the 409 error page', () => {
      cy.get('h1').should('contain.text', statusErrors[409].title)
      cy.get('[data-qa="errorMessage"]').should('contain.text', 'Go to the Manage people on probation homepage')
      cy.get('[data-qa="homepageLink"]').click()
      const homepage = new IndexPage()
      homepage.checkOnPage()
    })
  })
})
