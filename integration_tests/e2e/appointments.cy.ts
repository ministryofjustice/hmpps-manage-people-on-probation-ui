import Page from '../pages/page'
import AppointmentsPage from '../pages/appointments'

const url = (contactId: number, component = 'UpdateContact') =>
  `https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=${component}&CRN=X000001&contactID=${contactId}`

context('Appointment', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  it('Appointments page with upcoming and past appointments is rendered', () => {
    cy.visit('/case/X000001/appointments')
    const page = Page.verifyOnPage(AppointmentsPage)

    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Caroline Wolff')
    page.assertRiskTags()

    page.getElement('[data-qa="upcomingAppointments"]').find('h3').should('contain.text', 'Upcoming appointments')
    page.upcomingAppointmentDate(1).should('contain.text', '22 December 2044')
    page.upcomingAppointmentTime(1).should('contain.text', '9:15am')
    page.upcomingAppointmentType(1).should('contain.text', 'Phone call')

    page.getAlert().should('contain.text', 'medium')

    page
      .upcomingAppointmentAction(1)
      .find('a')
      .should('contain.text', 'Manage')
      .should(
        'have.attr',
        'href',
        `/case/X000001/appointments/appointment/1/manage?back=${encodeURIComponent('/case/X000001/appointments')}`,
      )
  })
  it('should render the page with date of death recorded warning', () => {
    cy.task('stubPersonalDetailsDateOfDeath')
    cy.visit('/case/X000001/appointments')
    cy.get('[data-qa="dateOfDeathWarning"]').should('contain.text', 'There is a date of death recorded for Caroline.')
  })
  it('Appointments page with upcoming and past appointments is rendered', () => {
    cy.visit('/case/X000001/appointments')
    const page = Page.verifyOnPage(AppointmentsPage)

    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Caroline Wolff')
    page.assertRiskTags()

    page.getAlert().should('contain.text', 'medium')

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

    page.getElement('[data-qa="pastAppointments"]').find('h3').should('contain.text', 'Past appointments')
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
      `/case/X000001/appointments/appointment/1/manage?back=${encodeURIComponent('/case/X000001/appointments')}`,
    )
    page.assertAnchorElementAtIndexWithin('[class="govuk-table__row"]', 2, 1, url(2))
    page.assertAnchorElementAtIndexWithin('[class="govuk-table__row"]', 4, 1, url(4))
    page.assertAnchorElementAtIndexWithin(
      '[class="govuk-table__row"]',
      5,
      1,
      `/case/X000001/appointments/appointment/5/manage?back=${encodeURIComponent('/case/X000001/appointments')}`,
    )
    page.assertAnchorElementAtIndexWithin('[class="govuk-table__row"]', 6, 1, url(6))
    page.assertAnchorElementAtIndexWithin('[class="govuk-table__row"]', 7, 1, url(3))

    page.getElement('[data-qa="appointmentHistory"]').find('h3').should('contain.text', 'Appointment history')
    page
      .getElement('[data-qa="appointmentHistory"]')
      .find('a')
      .should('contain.text', 'View all past appointments in the contacts')
      .should('have.attr', 'href', '/case/X000001/activity-log')
  })
  it('should render the page if the pop is deceased', () => {
    cy.task('stubPersonalDetailsDateOfDeath')
    cy.visit('/case/X000001/appointments')
    cy.get('[data-qa=arrange-appointment-btn]').should('not.exist')
    cy.get('[data-qa=online-checkin-btn]').should('not.exist')
  })
})
