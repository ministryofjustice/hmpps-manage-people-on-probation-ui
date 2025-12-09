import TechnicalUpdatesPage from '../pages/technicalUpdates'
import Page from '../pages/page'

context('Technical Updates', () => {
  beforeEach(() => {
    cy.visit('/whats-new')
  })

  it('Manage people on probation', () => {
    Page.verifyOnPage(TechnicalUpdatesPage)
  })

  it('Caption text visible on page', () => {
    const technicalUpdatesPage = Page.verifyOnPage(TechnicalUpdatesPage)
    technicalUpdatesPage.captionText().should('have.text', 'Manage people on probation')
  })

  it('header visible on page', () => {
    const technicalUpdatesPage = Page.verifyOnPage(TechnicalUpdatesPage)
    technicalUpdatesPage.headingText().should('have.text', 'What’s new')
  })

  it('technical updates banner is visible on page', () => {
    const technicalUpdatesPage = Page.verifyOnPage(TechnicalUpdatesPage)
    technicalUpdatesPage.technicalUpdatesBanner().should('not.have.class', 'moj-hidden')
  })
})
