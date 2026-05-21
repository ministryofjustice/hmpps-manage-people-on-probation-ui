import ManageAppointmentPage from '../../../pages/appointments/manage-appointment.page'
import { crn, loadPage } from './imports/common'

let manageAppointmentPage: ManageAppointmentPage

describe('Manage an appointment', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  it('should render the page', () => {
    loadPage()
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getBackLink().should('have.attr', 'href', `/case/${crn}/appointments`)
    manageAppointmentPage.checkPageTitle('Manage planned office visit (NS) with Terry Jones')
    manageAppointmentPage.getLastUpdated().should('contain.text', 'Last updated by Paul Smith on 20 March 2023')
  })

  it('should navigate back to the appointments list from the back link', () => {
    loadPage()
    manageAppointmentPage = new ManageAppointmentPage()

    manageAppointmentPage.getBackLink().click()

    cy.location('pathname').should('eq', `/case/${crn}/appointments`)
  })
})
