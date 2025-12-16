import AppointmentLocationDateTimePage from '../../pages/appointments/location-date-time.page'
import AppointmentLocationNotInListPage from '../../pages/appointments/location-not-in-list.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import { checkPopHeader, completeLocationDateTimePage, completeSentencePage, completeTypePage } from './imports'

const loadPage = (locations = true) => {
  completeSentencePage()
  completeTypePage()
  if (locations) {
    completeLocationDateTimePage({ index: 5 })
  }
}
describe('Arrange an appointment in another location', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  it('should render the page', () => {
    loadPage()
    const locationNotInListPage = new AppointmentLocationNotInListPage()
    checkPopHeader('Alton Berge', true)
    locationNotInListPage
      .getElement('p:nth-of-type(1)')
      .should(
        'contain.text',
        'You can only arrange appointments from a list of locations associated with the probation practitioner’s team.',
      )
    locationNotInListPage
      .getElement('p:nth-of-type(2)')
      .should(
        'contain.html',
        'If you think you’re missing a location, complete the <a href="https://mojprod.service-now.com/moj_sp?id=sc_cat_item&amp;table=sc_cat_item&amp;sys_id=6eb2ff221[…]ew.do%3Fv%3D1&amp;sysparm_id=6eb2ff221b2dad10a1e2ddf0b24bcb67" target="_blank" rel="noopener noreferrer">NDelius reference data - team/location form on the MoJ Technology Portal</a>.',
      )
    locationNotInListPage
      .getElement('p:nth-of-type(3)')
      .should('contain.text', '(opens in new tab)')
      .find('a')
      .should('contain.text', 'Continue on NDelius')
    locationNotInListPage
      .getElement('p:nth-of-type(4)')
      .find('a')
      .should('contain.text', 'Cancel and return to previous screen')
      .click()
    cy.location().should(location => {
      expect(location.href).to.eq(
        'http://localhost:3007/case/X778160/arrange-appointment/19a88188-6013-43a7-bb4d-6e338516818f/location-date-time',
      )
    })
  })
  it('should return to the locations page when back is clicked', () => {
    loadPage()
    cy.get('.govuk-back-link').click()
    const locationPage = new AppointmentLocationDateTimePage()
    locationPage.checkOnPage()
  })
  it('should return to the type attending page if no locations found and location selection is mandatory', () => {
    cy.task('stubNoUserLocationsFound')
    const locations = false
    loadPage(locations)
    cy.get('.govuk-back-link').click()
    const typePage = new AppointmentTypePage()
    typePage.checkOnPage()
  })
})
