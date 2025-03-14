import Page from '../../pages/page'
import UpcomingAppointments from '../../pages/upcomingAppointments'
import { getWiremockData, Wiremock } from '../../utils'
import mockResponse from '../../../wiremock/mappings/user-schedule.json'
import { UserActivity } from '../../../server/data/model/userSchedule'
import { yearsSince } from '../../../server/utils/utils'

const mockData = mockResponse as Wiremock

const mockAppointments = getWiremockData<UserActivity[]>(mockData, '/mas/user/USER1/schedule/upcoming', 'appointments')

context('Upcoming appointments', () => {
  afterEach(() => {
    cy.task('resetMocks')
  })
  it('Upcoming appointments page is rendered', () => {
    cy.visit('/caseload/appointments/upcoming')
    const page = Page.verifyOnPage(UpcomingAppointments)

    page.getTableColumnHeading(0).should('contain.text', 'Name / CRN')
    page.getTableColumnHeading(0).should('have.attr', 'data-sort-name', 'name')
    page.getTableColumnHeading(0).should('have.attr', 'data-sort-action', '/caseload/appointments/upcoming')
    page.getTableColumnHeading(0).find('button').should('exist')
    page.getTableColumnHeading(1).should('contain.text', 'DOB / Age')
    page.getTableColumnHeading(1).should('have.attr', 'data-sort-name', 'dob')
    page.getTableColumnHeading(1).should('have.attr', 'data-sort-action', '/caseload/appointments/upcoming')
    page.getTableColumnHeading(1).find('button').should('exist')
    page.getTableColumnHeading(2).should('contain.text', 'Sentence')
    page.getTableColumnHeading(2).should('have.attr', 'data-sort-name', 'sentence')
    page.getTableColumnHeading(2).should('have.attr', 'data-sort-action', '/caseload/appointments/upcoming')
    page.getTableColumnHeading(2).find('button').should('exist')
    page.getTableColumnHeading(3).should('contain.text', 'Appointment')
    page.getTableColumnHeading(3).should('have.attr', 'data-sort-name', 'appointment')
    page.getTableColumnHeading(3).should('have.attr', 'data-sort-action', '/caseload/appointments/upcoming')
    page.getTableColumnHeading(3).find('button').should('exist')
    page.getTableColumnHeading(4).should('contain.text', 'Date and time')
    page.getTableColumnHeading(4).should('have.attr', 'data-sort-name', 'date')
    page.getTableColumnHeading(4).should('have.attr', 'data-sort-action', '/caseload/appointments/upcoming')
    page.getTableColumnHeading(4).find('button').should('exist')
    page
      .getTableCell(1, 1)
      .find('a')
      .should('contain.text', 'Berge, Alton')
      .should('have.attr', 'href', '/case/X778160')
    page.getTableCell(1, 1).find('span').should('contain.text', 'X778160')
    page.getTableCell(1, 2).should('contain.text', '25 September 1975')
    page
      .getTableCell(1, 2)
      .find('span')
      .should('contain.text', `Age ${yearsSince(mockAppointments[0].dob)}`)
    page.getTableCell(1, 3).should('contain.text', 'Adult Custody < 12m')
    page
      .getTableCell(1, 3)
      .find('a')
      .should('contain.text', '+ 2 more')
      .should('have.attr', 'href', '/case/X778160/sentence')
    page.getTableCell(2, 3).find('a').should('not.exist')
    page
      .getTableCell(1, 4)
      .find('a')
      .should('contain.text', 'Home visit')
      .should('have.attr', 'href', '/case/X778160/appointments/appointment/1')
    page.getTableCell(1, 5).should('contain.text', '27 March 2025').should('contain.text', '9:30am')
    page.getTableCell(2, 5).should('contain.text', '28 March 2025').should('contain.text', '9:30am to 10:30am')
    cy.get('.govuk-pagination').should('exist')
    page
      .getPaginationItem(1)
      .find('a')
      .should('contain.text', '1')
      .should('have.attr', 'href', '/caseload/appointments/upcoming?page=0')
      .should('have.attr', 'aria-current', 'page')
    page
      .getPaginationItem(2)
      .find('a')
      .should('contain.text', '2')
      .should('have.attr', 'href', '/caseload/appointments/upcoming?page=1')
      .should('not.have.attr', 'aria-current', 'page')
    page
      .getPaginationItem(3)
      .find('a')
      .should('contain.text', '3')
      .should('have.attr', 'href', '/caseload/appointments/upcoming?page=2')
      .should('not.have.attr', 'aria-current', 'page')
    page.getPaginationItem(4).should('contain.text', '⋯')
    page
      .getPaginationItem(5)
      .find('a')
      .should('contain.text', '6')
      .should('have.attr', 'href', '/caseload/appointments/upcoming?page=5')
      .should('not.have.attr', 'aria-current', 'page')
    cy.get('.govuk-pagination__previous').should('not.exist')
    cy.get('.govuk-pagination__next')
      .should('exist')
      .find('a')
      .should('contain.text', 'Next')
      .should('have.attr', 'href', '/caseload/appointments/upcoming?page=1')
  })
  it('Upcoming appointments page 3 is rendered', () => {
    cy.visit('/caseload/appointments/upcoming?page=2')
    const page = Page.verifyOnPage(UpcomingAppointments)
    cy.get('.govuk-pagination__prev')
      .should('exist')
      .find('a')
      .should('contain.text', 'Previous')
      .should('have.attr', 'href', '/caseload/appointments/upcoming?page=1')
    page.getPaginationItem(1).find('a').should('contain.text', '1').should('not.have.attr', 'aria-current', 'page')
    page.getPaginationItem(2).should('contain.text', '⋯')
    page.getPaginationItem(3).find('a').should('contain.text', '2').should('not.have.attr', 'aria-current', 'page')
    page.getPaginationItem(4).find('a').should('contain.text', '3').should('have.attr', 'aria-current', 'page')
    page.getPaginationItem(5).find('a').should('contain.text', '4').should('not.have.attr', 'aria-current', 'page')
    page.getPaginationItem(6).should('contain.text', '⋯')
    page.getPaginationItem(7).find('a').should('contain.text', '6').should('not.have.attr', 'aria-current', 'page')
    cy.get('.govuk-pagination__next')
      .should('exist')
      .find('a')
      .should('have.attr', 'href', '/caseload/appointments/upcoming?page=3')
  })
  it('Upcoming appointments page 6 is rendered', () => {
    cy.visit('/caseload/appointments/upcoming?page=5')
    const page = Page.verifyOnPage(UpcomingAppointments)
    cy.get('.govuk-pagination__prev')
      .should('exist')
      .find('a')
      .should('contain.text', 'Previous')
      .should('have.attr', 'href', '/caseload/appointments/upcoming?page=4')
    page.getPaginationItem(1).find('a').should('contain.text', '1').should('not.have.attr', 'aria-current', 'page')
    page.getPaginationItem(2).should('contain.text', '⋯')
    page.getPaginationItem(3).find('a').should('contain.text', '4').should('not.have.attr', 'aria-current', 'page')
    page.getPaginationItem(4).find('a').should('contain.text', '5').should('not.have.attr', 'aria-current', 'page')
    page.getPaginationItem(5).find('a').should('contain.text', '6').should('have.attr', 'aria-current', 'page')
  })
  it('Requesting upcoming appointments returns a 500 error', () => {
    cy.task('stubUpcomingAppointments500Response')
    cy.visit('/caseload/appointments/upcoming', { failOnStatusCode: false })
    cy.get('h1').should('contain.text', 'Internal Server Error')
    cy.get('h2').should('contain.text', '500')
  })
  it('Upcoming appointments page is rendered with no results', () => {
    cy.task('stubNoUpcomingAppointments')
    cy.visit('/caseload/appointments/upcoming')
    cy.get('h1').should('contain.text', 'My upcoming appointments')
    cy.get('p').should('contain.text', 'No upcoming appointments.')
    cy.get('table').should('not.exist')
    cy.get('.govuk-pagination').should('not.exist')
  })
})
