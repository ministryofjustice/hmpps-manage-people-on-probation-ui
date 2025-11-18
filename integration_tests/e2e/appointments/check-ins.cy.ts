import Page from '../../pages/page'
import AppointmentsPage from '../../pages/appointments'
import InstructionsPage from '../../pages/check-ins/instructions'

context('Appointment', () => {
  it('Appointments page with online check-ins', () => {
    cy.task('stubEnableESuperVision')
    cy.visit('/case/X000001/appointments')

    let page = Page.verifyOnPage(AppointmentsPage)

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
})
