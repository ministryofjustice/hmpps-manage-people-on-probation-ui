import Page from '../pages/page'
import AppointmentPage from '../pages/appointment'
import AppointmentsPage from '../pages/appointments'

const url = (contactId: number, component = 'UpdateContact') =>
  `https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=${component}&CRN=X000001&contactID=${contactId}`

context('Appointment', () => {
  it('Appointment page with outcome is rendered', () => {
    cy.visit('/case/X000001/appointments/appointment/4')
    const page = new AppointmentPage()
    page.setPageTitle('Phone call with Steve Bruce')
    page.appointmentType().should('contain.text', 'Initial appointment')
    page.appointmentTitle().should('contain.text', 'Phone call with Steve Bruce')
    page.complianceTag().should('contain.text', 'Acceptable absence')
    page.getCardHeader('appointmentDetails').should('contain.text', 'Appointment details')
    page.getRowData('appointmentDetails', 'type', 'Value').should('contain.text', 'Phone call')
    page.getRowData('appointmentDetails', 'date', 'Value').should('contain.text', 'Friday 22 March')
    page.getRowData('appointmentDetails', 'time', 'Value').should('contain.text', '8:15am to 8:30am')
    page.getRowData('appointmentDetails', 'repeating', 'Value').should('contain.text', 'Yes')
    page.getRowData('appointmentDetails', 'rar', 'Value').should('contain.text', 'Choices and Changes')
    page.getCardHeader('outcomeDetails').should('contain.text', 'Outcome details')
    page.getRowData('outcomeDetails', 'complied', 'Value').should('contain.text', 'No')
    page.getRowData('outcomeDetails', 'outcome', 'Value').should('contain.text', 'User-generated free text content')
    page.getRowData('outcomeDetails', 'enforcementAction', 'Value').should('contain.text', 'Enforcement Action')
    page.getRowData('outcomeDetails', 'documents', 'Value').should('contain.text', 'Eula-Schmeler-X000001-UPW.pdf')
    page.getRowData('outcomeDetails', 'sensitive', 'Value').should('contain.text', 'No')
    page.getRowData('outcomeDetails', 'notes', 'Value').should('contain.text', 'Some notes')
  })
  it('Appointments page with upcoming and past appointments is rendered', () => {
    cy.visit('/case/X000001/appointments')
    const page = Page.verifyOnPage(AppointmentsPage)

    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Eula Schmeler')
    page.assertRiskTags()

    page.getElement('[data-qa="upcomingAppointments"]').find('h2').should('contain.text', 'Upcoming appointments')
    page.upcomingAppointmentDate(1).should('contain.text', '22 March 2045')
    page.upcomingAppointmentTime(1).should('contain.text', '10:15am to 10:30am')
    page.upcomingAppointmentType(1).should('contain.text', 'Video call')

    page
      .upcomingAppointmentAction(1)
      .find('a')
      .should('contain.text', 'Manage')
      .should('have.attr', 'target', '_blank')
      .should('have.attr', 'href', url(2))
  })
  it('Appointment page with no outcome recorded is rendered', () => {
    cy.visit('/case/X000001/appointments/appointment/3')
    const page = new AppointmentPage()
    page.setPageTitle('Video call with Paulie Walnuts')
    page.appointmentType().should('contain.text', 'Other contact')
    page.appointmentTitle().should('contain.text', 'Video call with Paulie Walnuts')
    cy.get('.note-panel').should('contain.text', 'Outcome not recorded')
    cy.get('.note-panel')
      .find('a')
      .should('contain.text', 'Log an outcome on NDelius (opens in new tab)')
      .should('have.attr', 'target', '_blank')
      .should('have.attr', 'href', url(3, 'UpdateContact'))
  })
  it('Appointments page with upcoming and past appointments is rendered', () => {
    cy.visit('/case/X000001/appointments')
    const page = Page.verifyOnPage(AppointmentsPage)

    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Eula Schmeler')
    page.assertRiskTags()
    cy.get('[data-qa="upcomingAppointments"] h2').should('contain.text', 'Upcoming appointments')
    cy.get('[data-qa="upcomingAppointments"] p').should(
      'contain.text',
      'All links to manage appointments open in new tabs on NDelius.',
    )
    cy.get('[data-qa="upcomingAppointments"] th').eq(0).should('contain.text', 'Appointment type')
    cy.get('[data-qa="upcomingAppointments"] th').eq(1).should('contain.text', 'Date')
    cy.get('[data-qa="upcomingAppointments"] th').eq(2).should('contain.text', 'Time')
    cy.get('[data-qa="upcomingAppointments"] th')
      .eq(3)
      .should('contain.html', 'Action<span class="govuk-visually-hidden"> (links open in new tab)</span>')
    page.upcomingAppointmentType(1).should('contain.text', 'Video call')
    page.upcomingAppointmentDate(1).should('contain.text', '22 March 2045')
    page.upcomingAppointmentTime(1).should('contain.text', '10:15am to 10:30am')

    page
      .upcomingAppointmentAction(1)
      .find('a')
      .should('contain.text', 'Manage')
      .should('have.attr', 'aria-label', 'Manage video call appointment on NDelius')
      .should('have.attr', 'target', '_blank')
      .should('have.attr', 'href', url(2))

    page.upcomingAppointmentDate(2).should('contain.text', '22 December 2044')
    page.upcomingAppointmentTime(2).should('contain.text', '9:15am')
    page.upcomingAppointmentType(2).should('contain.text', 'Phone call')

    page.getElement('[data-qa="pastAppointments"]').find('h2').should('contain.text', 'Past appointments')
    page.pastAppointmentDate(1).should('contain.text', '22 March 2024')
    page.pastAppointmentTime(1).should('contain.text', '8:15am to 8:30am')
    page.pastAppointmentType(1).should('contain.text', 'Phone call')
    page.pastAppointmentDate(2).should('contain.text', '21 March 2024')
    page.pastAppointmentTime(2).should('contain.text', '10:15am to 10:30am')
    page.pastAppointmentType(2).should('contain.text', 'Phone call')

    page.assertAnchorElementAtIndexWithin('[class="govuk-table__row"]', 1, 1, url(2))
    page.assertAnchorElementAtIndexWithin('[class="govuk-table__row"]', 2, 1, url(1))
    page.assertAnchorElementAtIndexWithin('[class="govuk-table__row"]', 4, 1, url(4))
    page.assertAnchorElementAtIndexWithin('[class="govuk-table__row"]', 5, 1, url(5))
    page.assertAnchorElementAtIndexWithin('[class="govuk-table__row"]', 6, 1, url(6))
    page.assertAnchorElementAtIndexWithin('[class="govuk-table__row"]', 7, 1, url(3))

    page.getElement('[data-qa="appointmentHistory"]').find('h2').should('contain.text', 'Appointment history')
    page
      .getElement('[data-qa="appointmentHistory"]')
      .find('a')
      .should('contain.text', 'View all past appointments in the activity log')
      .should('have.attr', 'href', '/case/X000001/activity-log')
  })
})
