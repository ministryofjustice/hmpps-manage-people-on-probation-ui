import Page from '../pages/page'
import AppointmentPage from '../pages/appointment'
import AppointmentsPage from '../pages/appointments'
import { crn } from './appointments/imports'

const url = (contactId: number, component = 'UpdateContact') =>
  `https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=${component}&CRN=X000001&contactID=${contactId}`

context('Appointment', () => {
  it('Appointments page with upcoming and past appointments is rendered', () => {
    cy.visit('/case/X000001/appointments')
    const page = Page.verifyOnPage(AppointmentsPage)

    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Eula Schmeler')
    page.assertRiskTags()

    page.getElement('[data-qa="upcomingAppointments"]').find('h2').should('contain.text', 'Upcoming appointments')
    page.upcomingAppointmentDate(1).should('contain.text', '22 December 2044')
    page.upcomingAppointmentTime(1).should('contain.text', '9:15am')
    page.upcomingAppointmentType(1).should('contain.text', 'Phone call')

    page.getAlert().should('contain.text', 'high')

    page
      .upcomingAppointmentAction(1)
      .find('a')
      .should('contain.text', 'Manage')
      .should('have.attr', 'href', `/case/X000001/appointments/appointment/1/manage`)
  })
  it('Appointments page with upcoming and past appointments is rendered', () => {
    cy.visit('/case/X000001/appointments')
    const page = Page.verifyOnPage(AppointmentsPage)

    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Eula Schmeler')
    page.assertRiskTags()

    page.getAlert().should('contain.text', 'high')

    cy.get('[data-qa="upcomingAppointments"] th').eq(0).should('contain.text', 'Appointment type')
    cy.get('[data-qa="upcomingAppointments"] th').eq(1).should('contain.text', 'Date')
    cy.get('[data-qa="upcomingAppointments"] th').eq(2).should('contain.text', 'Time')
    cy.get('[data-qa="upcomingAppointments"] th').eq(3).should('contain.html', 'Action')
    page.upcomingAppointmentType(1).should('contain.text', 'Phone call')
    page.upcomingAppointmentDate(1).should('contain.text', '22 December 2044')
    page.upcomingAppointmentTime(1).should('contain.text', '9:15am')

    page
      .upcomingAppointmentAction(2)
      .find('a')
      .should('contain.text', 'Manage')
      .should('have.attr', 'aria-label', 'Manage planned video contact (ns) appointment on NDelius')
      .should(
        'have.attr',
        'href',
        'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X000001&contactID=2',
      )

    page.upcomingAppointmentDate(2).should('contain.text', '22 March 2045')
    page.upcomingAppointmentTime(2).should('contain.text', '10:15am to 10:30am')
    page.upcomingAppointmentType(2).should('contain.text', 'Planned video contact (NS)')

    page.getElement('[data-qa="pastAppointments"]').find('h2').should('contain.text', 'Past appointments')
    page.pastAppointmentDate(1).should('contain.text', '22 March 2024')
    page.pastAppointmentTime(1).should('contain.text', '8:15am to 8:30am')
    page.pastAppointmentType(1).should('contain.text', 'Phone call')
    page.pastAppointmentDate(2).should('contain.text', '21 March 2024')
    page.pastAppointmentTime(2).should('contain.text', '10:15am to 10:30am')
    page.pastAppointmentType(2).should('contain.text', 'Phone call')

    page.assertAnchorElementAtIndexWithin(
      '[class="govuk-table__row"]',
      1,
      1,
      `/case/X000001/appointments/appointment/1/manage`,
    )
    page.assertAnchorElementAtIndexWithin('[class="govuk-table__row"]', 2, 1, url(2))
    page.assertAnchorElementAtIndexWithin('[class="govuk-table__row"]', 4, 1, url(4))
    page.assertAnchorElementAtIndexWithin(
      '[class="govuk-table__row"]',
      5,
      1,
      `/case/X000001/appointments/appointment/5/manage`,
    )
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
