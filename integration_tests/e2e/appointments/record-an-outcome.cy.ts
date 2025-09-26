import Page from '../../pages/page'
import OverviewPage from '../../pages/overview'
import RecordAnOutcomePage from '../../pages/appointments/record-an-outcome.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'

const loadPage = (actionType = 'outcome') => {
  cy.visit('/case/X000001')
  const page = Page.verifyOnPage(OverviewPage)
  page.getAppointmentsLink('X000001', actionType).click()
}
context('Record an outcome', () => {
  let recordAnOutcomePage: RecordAnOutcomePage
  let manageAppointmentPage: ManageAppointmentPage

  describe('Record an outcome', () => {
    it('page is rendered', () => {
      loadPage()
      recordAnOutcomePage = new RecordAnOutcomePage()
      recordAnOutcomePage.checkPageTitle('Which appointment are you recording an outcome for?')
      cy.get('.govuk-radios').find('.govuk-radios__item').should('have.length', 2)
      cy.get('label[for="appointment-id"]')
        .should('contain.text', 'Phone call')
        .should('contain.text', 'Thursday 21 March from 10:15am to 10:30am')
      cy.get('input#appointment-id').should('not.be.checked')
      cy.get('label[for="appointment-id-2"]')
        .should('contain.text', 'Other call')
        .should('contain.text', 'Wednesday 21 February from 10:15am to 10:30am')
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
      cy.get('input#appointment-id').should('be.checked')
    })
  })
  describe('Waiting for evidence', () => {
    it('page is rendered', () => {
      loadPage('evidence')
      recordAnOutcomePage = new RecordAnOutcomePage()
      recordAnOutcomePage.checkPageTitle('Which appointment?')
      cy.get('.govuk-radios').find('.govuk-radios__item').should('have.length', 1)
      cy.get('label[for="appointment-id"]')
        .should('contain.text', 'Planned Video Contact (NS)')
        .should('contain.text', 'Monday 12 February from 10:15am to 10:30am')
      cy.get('input#appointment-id').should('not.be.checked')
      cy.get('input#appointment-id').click()
      recordAnOutcomePage.getSubmitBtn().click()
      manageAppointmentPage = new ManageAppointmentPage()
      manageAppointmentPage.checkPageTitle('Manage video call with Paulie Walnuts')
      manageAppointmentPage.getBackLink().click()
      cy.get('input#appointment-id').should('be.checked')
    })
  })
})
