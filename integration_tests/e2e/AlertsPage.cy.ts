import Page from '../pages'
import AlertsPage from '../pages/AlertsPage'

context('Alerts Dashboard', () => {
  afterEach(() => {
    cy.task('resetMocks')
  })
  it('Alerts page renders "No alerts" message when the list is empty', () => {
    cy.task('stubNoUserAlerts', { token: 'token-no-alerts' })
    cy.visit('/alerts')
    const page = Page.verifyOnPage(AlertsPage)
    page.noAlertsMessage().should('be.visible')
    page.getElement('[data-qa="alertsTable"]').should('not.exist')
    page.getElement('[data-qa="clearSelectedAlerts"]').should('not.exist')
  })
})
