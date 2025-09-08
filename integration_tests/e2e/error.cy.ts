import Page from '../pages/page'
import { statusErrors } from '../../server/properties/statusErrors'
import IndexPage from '../pages'

context('Status errors', () => {
  it('500 page is rendered', () => {
    cy.task('stubUpcomingAppointments500Response')
    cy.visit('/caseload/appointments/upcoming', { failOnStatusCode: false })
    cy.get('h1').should('contain.text', statusErrors[500].title)
    cy.get('[data-qa="errorMessage"]').should('contain.html', statusErrors[500].message)
  })
  it('404 page is rendered', () => {
    cy.visit('/page/does/not/exist', { failOnStatusCode: false })
    cy.get('h1').should('contain.text', statusErrors[404].title)
    cy.get('[data-qa="errorMessage"]').should('contain.html', statusErrors[404].message).find('a').click()
    Page.verifyOnPage(IndexPage)
  })
})
