import Page from '../../pages/page'
import OverviewPage from '../../pages/overview'
import RecordAnOutcomePage from '../../pages/appointments/record-an-outcome.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'

const loadPage = (actionType = 'outcome', crn = 'X000001') => {
  cy.visit(`/case/${crn}`)
  const page = Page.verifyOnPage(OverviewPage)
  page.getAppointmentsLink(crn, actionType).click()
}
context('Record an outcome', () => {
  let recordAnOutcomePage: RecordAnOutcomePage
  let manageAppointmentPage: ManageAppointmentPage

  describe('Record an outcome', () => {
    it('page is rendered', () => {
      loadPage()
      recordAnOutcomePage = new RecordAnOutcomePage()
      recordAnOutcomePage.checkPageTitle('Which appointment are you recording an outcome for?')
      cy.get('[data-qa="outcomes-form"]').find('.govuk-radios__item').should('have.length', 2)
      cy.get('label[for="appointment-id"]')
        .should('contain.text', 'Phone call')
        .should('contain.text', 'Saturday 21 March 2026 from 10:15am to 10:30am')
      cy.get('input#appointment-id').should('not.be.checked')
      cy.get('label[for="appointment-id-2"]')
        .should('contain.text', 'Other call')
        .should('contain.text', 'Friday 21 February 2025 from 10:15am to 10:30am')
      cy.get('input#appointment-id-2').should('not.be.checked')
    })
    it('should display validation if continue is clicked without selecting an appointment', () => {
      loadPage()
      recordAnOutcomePage.getSubmitBtn().click()
      recordAnOutcomePage.checkErrorSummaryBox(['Which appointment are you recording an outcome for?'])
      recordAnOutcomePage
        .getElement(`#appointment-id-error`)
        .should('contain.text', 'Which appointment are you recording an outcome for?')
    })
    it('should redirect to the manage appointment page', () => {
      loadPage()
      cy.get('input#appointment-id').click()
      recordAnOutcomePage.getSubmitBtn().click()
      manageAppointmentPage = new ManageAppointmentPage()
      manageAppointmentPage.checkPageTitle('Manage phone call with Terry Jones')
      manageAppointmentPage.getBackLink().click()
      cy.get('input#appointment-id').should('not.be.checked')
    })
    it('should filter to older when filter is applied', () => {
      loadPage()
      cy.get('input#outcomesFilter-2').click()
      cy.get('[data-qa="submit-button"]').click()
      cy.get('[data-qa="outcomes-form"]').find('.govuk-radios__item').should('have.length', 1)
      cy.get('label[for="appointment-id"]')
        .should('contain.text', 'Other call')
        .should('contain.text', 'Tuesday 21 February 2023 from 9:15am to 9:30am')
    })
    it('should filter to all when filter is applied', () => {
      loadPage()
      cy.get('input#outcomesFilter-3').click()
      cy.get('[data-qa="submit-button"]').click()
      cy.get('[data-qa="outcomes-form"]').find('.govuk-radios__item').should('have.length', 3)
      cy.get('label[for="appointment-id"]')
        .should('contain.text', 'Phone call')
        .should('contain.text', 'Saturday 21 March 2026 from 10:15am to 10:30am')
      cy.get('label[for="appointment-id-2"]')
        .should('contain.text', 'Other call')
        .should('contain.text', 'Friday 21 February 2025 from 10:15am to 10:30am')
      cy.get('label[for="appointment-id-3"]')
        .should('contain.text', 'Other call')
        .should('contain.text', 'Tuesday 21 February 2023 from 9:15am to 9:30am')
    })
    it('should reset filter when first visiting page from new case', () => {
      cy.task('stubDisableEMDIOverviewShowGPSData')
      loadPage()
      cy.get('input#outcomesFilter').should('be.checked')
      cy.get('input#outcomesFilter-3').click()
      cy.get('[data-qa="submit-button"]').click()
      loadPage('outcome', 'X000002')
      cy.get('input#outcomesFilter').should('be.checked')
    })
  })
})
