import AppointmentLocationNotInListPage from '../../pages/appointments/location-not-in-list.page'
import AppointmentLocationPage from '../../pages/appointments/location.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import { completeAttendancePage, completeLocationPage, completeSentencePage, completeTypePage } from './imports'

const loadPage = (locations = true) => {
  completeTypePage()
  completeSentencePage()
  completeAttendancePage()
  if (locations) {
    completeLocationPage(4)
  }
}
describe('Arrange an appointment in another location', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  it('should render the page', () => {
    loadPage()
    const locationNotInListPage = new AppointmentLocationNotInListPage()
    locationNotInListPage
      .getElement('p:nth-of-type(1)')
      .should(
        'contain.text',
        'You can only arrange appointments from a list of locations associated with the probation practitioner’s team.',
      )
    locationNotInListPage
      .getElement('p:nth-of-type(2)')
      .should(
        'contain.text',
        'You’ll need to open Alton’s case on NDelius to arrange an appointment in another location.',
      )
    locationNotInListPage
      .getElement('p:nth-of-type(3)')
      .should('contain.text', '(opens in new tab)')
      .find('a')
      .should('contain.text', 'Continue on NDelius')
    locationNotInListPage
      .getElement('p:nth-of-type(4)')
      .find('a')
      .should('contain.text', 'Cancel and return to preview screen')
      .click()
    cy.location().should(location => {
      expect(location.href).to.eq('http://localhost:3007/')
    })
  })
  it('should return to the locations page when back is clicked', () => {
    loadPage()
    cy.get('.govuk-back-link').click()
    const locationPage = new AppointmentLocationPage()
    locationPage.checkOnPage()
  })
  it('should return to the type page if no locations found and location selection is mandatory', () => {
    cy.task('stubNoUserLocationsFound')
    const locations = false
    loadPage(locations)
    cy.get('.govuk-back-link').click()
    const typePage = new AppointmentTypePage()
    typePage.checkOnPage()
  })
})
