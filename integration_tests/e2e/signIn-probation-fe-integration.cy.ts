import IndexPage from '../pages/index'
import AuthSignInPage from '../pages/authSignIn'
import Page from '../pages/page'

context('Sign In', () => {
  afterEach(() => {
    cy.task('resetMocks')
  })

  it('User name visible in header', () => {
    cy.visit('/')
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.headerUserNameByAnySpan().contains('J. Smith').should('exist')
  })

  it('Phase banner visible in header', () => {
    cy.visit('/')
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.headerPhaseProbFEBanner().should('contain.text', 'DEV')
  })

  it('User can sign out', () => {
    cy.visit('/')
    Page.verifyOnPage(IndexPage)
    // The FE header user menu toggle can be hidden in CI; navigate directly to sign-out route instead
    cy.visit('/sign-out')
    Page.verifyOnPage(AuthSignInPage)
  })
})

context('Sign In, when Probation FE API fails, fallback header/footer/js/css should be displayed.', () => {
  beforeEach(() => {
    cy.task('resetMocks')
    cy.task('stubProbationFEAPI500Response')
  })
  afterEach(() => {
    cy.task('resetMocks')
  })

  it('User name visible in header', () => {
    cy.visit('/')
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.headerUserNameByAnySpan().contains('J. Smith').should('exist')
  })

  it('Phase banner visible in header', () => {
    cy.visit('/')
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.headerPhaseProbFEBanner().should('contain.text', 'DEV')
  })

  it('User can sign out', () => {
    cy.visit('/')
    Page.verifyOnPage(IndexPage)
    // The FE header user menu toggle can be hidden in CI; navigate directly to sign-out route instead
    cy.visit('/sign-out')
    Page.verifyOnPage(AuthSignInPage)
  })
})
