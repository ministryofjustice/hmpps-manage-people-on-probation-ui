import AppointmentLocationDateTimePage from '../../pages/appointments/location-date-time.page'
import AppointmentLocationNotInListPage from '../../pages/appointments/location-not-in-list.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import { checkPopHeader } from './imports'
import { completeLocationDateTimePage, completeSentencePage, completeTypePage } from './utils'

const loadPage = (locations = true) => {
  completeSentencePage()
  completeTypePage()
  if (locations) {
    completeLocationDateTimePage({ index: 5 })
  }
}
// Logs a named step (Given / When / Then / And) in the Cypress command log, so a failure shows which step it was
const step = (name: string, fn: () => void) => {
  cy.log(`**${name}**`)
  fn()
}

describe('Arrange an appointment in another location', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })

  it('returns to the locations page using either the cancel link or the back link', () => {
    let locationNotInListPage: AppointmentLocationNotInListPage

    step('Given I am on the location not in list page', () => {
      loadPage()
      locationNotInListPage = new AppointmentLocationNotInListPage()
      checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: 'X778160' })
    })

    step('When I click cancel, then I am returned to the locations page', () => {
      locationNotInListPage.getElement('p:nth-of-type(4)').find('a').click()
      new AppointmentLocationDateTimePage().checkOnPage()
      cy.location().should(location => {
        expect(location.href).to.eq(
          'http://localhost:3007/case/X778160/arrange-appointment/19a88188-6013-43a7-bb4d-6e338516818f/location-date-time',
        )
      })
    })

    step('When I return to the location not in list page and click back, then I am on the locations page', () => {
      cy.go('back')
      new AppointmentLocationNotInListPage().checkOnPage()
      cy.get('.govuk-back-link').click()
      new AppointmentLocationDateTimePage().checkOnPage()
    })
  })

  it('returns to the type attendance page if no locations are found and location selection is mandatory', () => {
    step('Given no locations are found and I am on the location not in list page', () => {
      cy.task('stubNoUserLocationsFound')
      const locations = false
      loadPage(locations)
    })

    step('When I click back, then I am returned to the type attendance page', () => {
      cy.get('.govuk-back-link').click()
      new AppointmentTypePage().checkOnPage()
    })
  })
})
