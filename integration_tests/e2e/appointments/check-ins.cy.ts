import Page from '../../pages/page'
import AppointmentsPage from '../../pages/appointments'
import InstructionsPage from '../../pages/check-ins/instructions'
import DateFrequencyPage from '../../pages/check-ins/date-frequencey'
import { getCheckinUuid } from './imports'
import ContactPreferencePage from '../../pages/check-ins/contact-preference'

const loadPage = () => {
  cy.task('stubEnableESuperVision')
  cy.visit(`/case/X000001/appointments`)
}
context('Appointment check-ins', () => {
  it('Appointments page with online check-ins', () => {
    loadPage()
    const page = Page.verifyOnPage(AppointmentsPage)
    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Eula Schmeler')
    cy.get('[data-qa="appointments-header-label"]').should('contain.text', 'Appointments')
    page.getElement('[data-qa="upcomingAppointments"]').find('h2').should('contain.text', 'Upcoming appointments')
    page
      .getElement('[data-qa="online-checkin-btn"]')
      .should('be.visible')
      .and('contain.text', 'Set up online check ins')
    page.getElement('[data-qa="online-checkin-btn"]').click()
    cy.url().should('contain', '/case/X000001/appointments/check-in/instructions')
    const instructionsPage = new InstructionsPage()
    instructionsPage.checkOnPage()
    instructionsPage.getElement('[data-qa="formAnchorLink"]').click()
    Page.verifyOnPage(AppointmentsPage)
  })

  it('check-in frequency page should fail with validation errors', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const instructionsPage = new InstructionsPage()
    instructionsPage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    dateFrequencyPage.getSubmitBtn().click()
    dateFrequencyPage.checkErrorSummaryBox([
      'Select how often you would like the person to check in',
      'Enter the date you would like the person to complete their first check in',
    ])

    getCheckinUuid().then(uuid => {
      dateFrequencyPage.getElement(`#appointments-X000001-${uuid}-checkins-date-error`).should($error => {
        expect($error.text().trim()).to.include(
          'Enter the date you would like the person to complete their first check in',
        )
      })
      dateFrequencyPage.getElement(`#appointments-X000001-${uuid}-checkins-interval-error`).should($error => {
        expect($error.text().trim()).to.include('Select how often you would like the person to check in')
      })
    })
  })

  it('should able to submit check-in frequency details', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const instructionsPage = new InstructionsPage()
    instructionsPage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()

    dateFrequencyPage.getDatePickerToggle().click()
    dateFrequencyPage.getNextDayButton().click()
    dateFrequencyPage.getFrequency().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    dateFrequencyPage.getSubmitBtn().click()
    const contactPreferencePage = new ContactPreferencePage()
    contactPreferencePage.checkOnPage()
  })
})
