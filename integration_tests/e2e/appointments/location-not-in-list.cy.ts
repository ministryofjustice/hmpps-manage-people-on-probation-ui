import AppointmentLocationNotInListPage from '../../pages/appointments/location-not-in-list.page'
import { completeAttendancePage, completeLocationPage, completeSentencePage, completeTypePage } from './imports'

describe('Arrange an appointment in another location', () => {
  beforeEach(() => {
    completeTypePage()
    completeSentencePage()
    completeAttendancePage()
    completeLocationPage(4)
  })
  it('should render the page', () => {
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
})
