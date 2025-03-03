import IndexPage from '../pages/index'
import AuthSignInPage from '../pages/authSignIn'
import Page from '../pages/page'
import SearchPage from '../pages/search'

context('Sign In', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })

  it('User name visible in header', () => {
    cy.visit('/')
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.headerUserName().should('contain.text', 'J. Smith')
  })

  it('Phase banner visible in header', () => {
    cy.visit('/')
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.headerPhaseBanner().should('contain.text', 'local')
  })

  it('User can sign out', () => {
    cy.visit('/')
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.signOut().click()
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Redirects to /search when no cases available', () => {
    cy.task('stubUserNoCaseload')
    cy.visit('/')
    Page.verifyOnPage(SearchPage)
  })

  it('Redirects to /search when caseload returns 404', () => {
    cy.task('stubUserNoStaffRecord')
    cy.visit('/')
    Page.verifyOnPage(SearchPage)
  })
})
