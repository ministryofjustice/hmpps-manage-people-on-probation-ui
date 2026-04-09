import TechnicalUpdatesPage from '../pages/technicalUpdates'
import Page from '../pages/page'
import IndexPage from '../pages'

context('Cookie and privacy policy changes', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Check privacy policy link in footer', () => {
    const page = Page.verifyOnPage(IndexPage)
    cy.get('[data-qa="privacyPolicyLink"]')
      .should('have.attr', 'href', '/privacy-policy')
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
      .and('contain.text', 'Privacy policy')
  })

  it('Check privacy page', () => {
    cy.visit('/privacy-policy')
    cy.get('[data-qa=pageHeading]').contains('Privacy policy for Manage people on probation')
    cy.get('[data-qa="back-link"]').click()
    Page.verifyOnPage(IndexPage)
  })

  it('Check cookie policy link in footer', () => {
    const page = Page.verifyOnPage(IndexPage)

    cy.get('[data-qa="cookiesPolicyLink"]')
      .should('have.attr', 'href', '/cookies-policy')
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
      .and('contain.text', 'Cookies policy')
  })

  it('Check cookie page', () => {
    cy.visit('/cookies-policy')
    cy.get('[data-qa=pageHeading]').contains('Cookies policy for Manage people on probation')
    cy.get('[data-qa="back-link"]').click()
    Page.verifyOnPage(IndexPage)
  })
})
