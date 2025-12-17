import Page from '../pages'
import AlertsPage from '../pages/alerts'
import OverviewPage from '../pages/overview'

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

  it('Alerts page renders alerts when they exist', () => {
    cy.visit('/alerts')
    const page = Page.verifyOnPage(AlertsPage)
    page.noAlertsMessage().should('not.exist')
    page.getElement('[data-qa="alertsTable"]').should('be.visible')
    page.getElement('[data-qa="clearSelectedAlerts"]').should('be.visible')
  })

  it('Person link should navigate to case overview', () => {
    cy.visit('/alerts')
    const page = Page.verifyOnPage(AlertsPage)
    cy.get('.govuk-table__row').eq(1).find('[data-qa="alertPerson"]').find('a').click()
    const overviewPage = new OverviewPage()
    overviewPage.checkOnPage()
  })

  it('Update link opens in NDelius', () => {
    cy.visit('/alerts')
    const page = Page.verifyOnPage(AlertsPage)
    cy.get('.govuk-table__row')
      .eq(1)
      .find('[data-qa="alertActions"]')
      .find('a')
      .should('contain.text', 'Update')
      .should(
        'have.attr',
        'href',
        'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=Contact&CRN=X000001&contactID=1',
      )
      .should('have.attr', 'target', '_blank')
  })

  it('Note is not visible by default', () => {
    cy.visit('/alerts')
    const page = Page.verifyOnPage(AlertsPage)
    cy.get('[data-qa="moreInfo-1"]').find('[data-qa="alertNotes-1"]').should('not.contain.text')
  })
  it('Note becomes visible after clicking', () => {
    cy.visit('/alerts')
    const page = Page.verifyOnPage(AlertsPage)
    cy.get('[data-qa="moreInfo-1"]').click()
    cy.get('[data-qa="moreInfo-1"]')
      .find('[data-qa="alertNotes-1"]')
      .should(
        'contain.text',
        'Person did not attend appointment at 2pm. No contact made prior to appointment time. Phone call attempted but no answer.',
      )
  })

  it('View full note', () => {
    cy.visit('/alerts')
    const page = Page.verifyOnPage(AlertsPage)
    cy.get('[data-qa="moreInfo-8"]').click()
    cy.get('[data-qa="moreInfo-8"]')
      .find('[data-qa="alertNotes-8"]')
      .find('a')
      .should('have.attr', 'href', `/alerts/8/note/0?back=${encodeURIComponent('/alerts')}`)
      .click()
    cy.get('[data-qa="moreInfo-1"]')
      .find('[data-qa="alertNotes-1"]')
      .should(
        'contain.text',
        'Person did not attend appointment at 2pm. No contact made prior to appointment time. Phone call attempted but no answer.',
      )
  })
})
