import IndexPage from '../pages/index'
import Page from '../pages/page'
import SearchPage from '../pages/search'

context('Sign In', () => {
  afterEach(() => {
    cy.task('resetMocks')
  })

  it('Renders the the appointments', () => {
    cy.visit('/')
    const page = Page.verifyOnPage(IndexPage)

    page.getAppointments().should('exist')
    page.getAppointments().should('contain.text', 'My upcoming appointments')
    page.getAppointmentRows().should('have.length', 5)
  })

  it('Renders the the outcomes to log', () => {
    cy.visit('/')
    const page = Page.verifyOnPage(IndexPage)

    page.getOutcomesToLog().should('exist')
    page.getOutcomesToLog().should('contain.text', 'Outcomes to log (21)')
    page.getAppointmentRows().should('have.length', 5)
  })

  it('Renders correctly when appointments and outcomes to log are empty', () => {
    cy.task('stubEmptyHomepage')

    cy.visit('/')
    const page = Page.verifyOnPage(IndexPage)

    page.getAppointments().should('exist')
    page.getAppointments().should('contain.text', 'My upcoming appointments')
    page.getAppointmentRows().should('not.exist')
    page.getOutcomesToLog().should('exist')
    page.getOutcomesToLog().should('contain.text', 'Outcomes to log (0)')
    page.getAppointmentRows().should('not.exist')
  })

  it('Renders "Other Services" section', () => {
    cy.visit('/')
    const page = Page.verifyOnPage(IndexPage)

    page.getOtherServices().should('exist')
    page.getOtherServices().should('contain.text', 'Other services')
  })

  it('Submits search input to /search', () => {
    cy.visit('/')
    const page = Page.verifyOnPage(IndexPage)

    page.getSearchSubmit().should('exist')
    page.getSearchSubmit().click()

    Page.verifyOnPage(SearchPage)
  })
})
