import Page from '../pages/page'
import SearchPage from '../pages/search'

context('Search', () => {
  it('Search page is rendered', () => {
    cy.visit('/search')
    const page = Page.verifyOnPage(SearchPage)
    page.getNavigationLink(1).should('contain.text', 'Home')
    page.getNavigationLink(1).should('not.have.attr', 'aria-current', 'home')
    page.getNavigationLink(2).should('contain.text', 'Cases')
    page.getNavigationLink(2).should('not.have.attr', 'aria-current', 'cases')
    page.getNavigationLink(3).should('contain.text', 'Search')
    page.getNavigationLink(3).should('have.attr', 'aria-current', 'search')
    page.getNavigationLink(4).should('contain.text', 'Alerts')
    page.getNavigationLink(4).get('.moj-notification-badge').should('contain.text', 12)
    page.getNavigationLink(4).should('not.have.attr', 'aria-current', 'alerts')
  })
  it('Search tooltip exists', () => {
    cy.visit('/search')
    cy.get("[data-qa='searchTips']").should('contain.text', 'Tips for searching')
    cy.get('summary').click()
    cy.get("[data-qa='searchTips']").should('have.attr', 'open')
    cy.get("[data-qa='searchTips']").should(
      'contain.text',
      `You can search for first names, middle names, alias names, surnames and recorded gender.`,
    )
  })
})
