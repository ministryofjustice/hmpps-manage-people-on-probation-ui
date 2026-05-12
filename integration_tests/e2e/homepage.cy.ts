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
    page.getAppointments().find('button').should('have.attr', 'aria-expanded', 'false')
  })

  it('Renders the the outcomes to log with 2 years filter', () => {
    cy.visit('/')
    const page = Page.verifyOnPage(IndexPage)
    page.getOutcomesToLog().should('exist')
    page.getOutcomesToLog().should('contain.text', 'Outcomes to log (')
    page.getOutcomesToLogRows().should('have.length', 5)
    page.getOutcomesToLog().find('button').should('have.attr', 'aria-expanded', 'false')
  })

  it('Renders the enforcement actions', () => {
    cy.visit('/')
    const page = Page.verifyOnPage(IndexPage)
    page.getEnforcementActions().should('exist')
    page.getEnforcementActions().should('contain.text', 'My enforcement actions')
    page.getEnforcementActionRows().should('have.length', 2)
    page.getEnforcementActions().find('button').should('have.attr', 'aria-expanded', 'false')

    // Check for "Overdue" label for the first row (Garrett Emard in wiremock mapping)
    page.getEnforcementActionRows().eq(0).should('contain.text', 'Overdue')

    // Check for "Manage on NDelius" link for the first row (deliusManaged: true)
    page.getEnforcementActionRows().eq(0).find('a').contains('Manage on NDelius').should('exist')

    // Check for "Manage" link for the second row (Ethan Bradtke in wiremock mapping, deliusManaged: false)
    page.getEnforcementActionRows().eq(1).find('a').contains('Manage').should('exist')
    page.getEnforcementActionRows().eq(1).should('not.contain.text', 'Overdue')
  })

  it('Renders the the outcomes to log', () => {
    cy.task('stubDisableHomePageOutcome')
    cy.visit('/')
    const page = Page.verifyOnPage(IndexPage)
    page.getOutcomesToLog().should('exist')
    page.getOutcomesToLog().should('contain.text', 'Outcomes to log (21)')
    page.getOutcomesToLogRows().should('have.length', 5)
    page.getOutcomesToLog().find('button').should('have.attr', 'aria-expanded', 'false')
  })

  it('Renders correctly when appointments and outcomes to log are empty', () => {
    cy.task('stubEmptyHomepage')
    cy.task('stubEmptyEnforcementContacts')
    cy.visit('/')
    const page = Page.verifyOnPage(IndexPage)
    page.getAppointments().should('exist')
    page.getAppointments().should('contain.text', 'My upcoming appointments')
    page.getAppointments().should('not.contain.text', 'View all upcoming appointments')
    page.getAppointments().find('button').should('have.attr', 'aria-expanded', 'true')
    page.getAppointmentRows().should('not.exist')
    page.getOutcomesToLog().should('exist')
    page.getOutcomesToLog().should('not.contain.text', '(0)').should('contain.text', 'Outcomes to log')
    page.getOutcomesToLog().should('not.contain.text', 'Log more outcomes')
    page.getOutcomesToLog().find('button').should('have.attr', 'aria-expanded', 'true')
    page.getAppointmentRows().should('not.exist')
    page.getEnforcementActions().should('exist')
    page.getEnforcementActions().should('contain.text', 'My enforcement actions')
    page.getEnforcementActions().should('not.contain.text', 'View all enforcement actions')
    page.getEnforcementActions().find('button').should('have.attr', 'aria-expanded', 'true')
    page.getEnforcementActionRows().should('not.exist')
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
