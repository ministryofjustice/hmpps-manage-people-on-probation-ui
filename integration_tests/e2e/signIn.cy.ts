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
    indexPage.headerPhaseBanner().should('contain.text', 'local')
  })

  it('User can sign out', () => {
    cy.visit('/')
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.menuButton().click()
    indexPage.feSignOut().eq(1).click()
    Page.verifyOnPage(AuthSignInPage)
  })
})
