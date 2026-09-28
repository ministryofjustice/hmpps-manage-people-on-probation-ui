import AddNotePage from '../../../pages/appointmentOutcomes/add-note.page'
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
    manageAppointmentPage.getBackLink().click()
    cy.get(`[data-qa="arrange-appointment-btn"]`).should('exist')
  })

  it('should not update backLink when note added', () => {
    loadPage()
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getBackLink().should('have.attr', 'href', `/case/${crn}/appointments`)
    manageAppointmentPage.getTaskLink(2).click()
    const addNotePage = new AddNotePage()
    addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
    addNotePage.getSubmitBtn().click()
    manageAppointmentPage.checkPageTitle('Manage planned office visit (NS) with Terry Jones')
    manageAppointmentPage.getBackLink().should('have.attr', 'href', `/case/${crn}/appointments`)
  })
})
