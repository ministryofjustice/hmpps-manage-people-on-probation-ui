import Page from '../pages/page'
import UpcomingAppointmentsPage from '../pages/appointments'

const url = (contactId: number, component = 'UpdateContact') =>
  `https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=${component}&CRN=X000001&contactID=${contactId}`

context('All Upcoming Appointment', () => {
  it('Appointments page with upcoming appointments is rendered', () => {
    cy.visit('/case/X000001/upcoming-appointments')
    const page = Page.verifyOnPage(UpcomingAppointmentsPage)

    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Caroline Wolff')
    page.assertRiskTags()

    page.getElement('[data-qa="upcomingAppointments"]').find('h2').should('contain.text', 'All upcoming appointments')
    page.upcomingAppointmentDate(1).should('contain.text', '22 December 2044')
    page.upcomingAppointmentTime(1).should('contain.text', '9:15am')
    page.upcomingAppointmentType(1).should('contain.text', 'Phone call')

    page
      .upcomingAppointmentAction(1)
      .find('a')
      .should('contain.text', 'Manage')
      .should(
        'have.attr',
        'href',
        `/case/X000001/appointments/appointment/1/manage?back=${encodeURIComponent(
          '/case/X000001/upcoming-appointments',
        )}`,
      )
  })
})
