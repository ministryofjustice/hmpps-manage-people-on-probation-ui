import UserAppointments from '../../pages/userAppointments'
import { getWiremockData, Wiremock } from '../../utils'
import { UserActivity } from '../../../server/data/model/userSchedule'
import mockResponse from '../../../wiremock/mappings/user-schedule.json'
import { yearsSince } from '../../../server/utils/utils'

const mockData = mockResponse as Wiremock

const mockAppointments = getWiremockData<UserActivity[]>(
  mockData,
  '/mas/user/USER1/schedule/no-outcome',
  'appointments',
)

const checkColumnHeading = (page: UserAppointments, index: number, label: string, name: string, action: string) => {
  page.getTableColumnHeading(index).should('contain.text', label)
  page.getTableColumnHeading(index).should('have.attr', 'data-sort-name', name)
  page.getTableColumnHeading(index).should('have.attr', 'data-sort-action', action)
  page.getTableColumnHeading(index).find('button').should('exist')
}

context('Outcomes to log', () => {
  afterEach(() => {
    cy.task('resetMocks')
  })
  it('Outcomes to log page is rendered', () => {
    cy.visit('/caseload/appointments/no-outcome')
    const page = new UserAppointments()
    page.setPageTitle('Outcomes to log')
    checkColumnHeading(page, 0, 'Name / CRN', 'name', '/caseload/appointments/no-outcome')
    checkColumnHeading(page, 1, 'DOB / Age', 'dob', '/caseload/appointments/no-outcome')
    checkColumnHeading(page, 2, 'Sentence', 'sentence', '/caseload/appointments/no-outcome')
    checkColumnHeading(page, 3, 'Date and time', 'date', '/caseload/appointments/no-outcome')
    page.getTableColumnHeading(4).should('contain.text', 'Action')
    page.getTableColumnHeading(4).find('button').should('not.exist')
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
      .should('contain.text', '+ 3 more')
      .should('have.attr', 'href', '/case/X778160/sentence')
    page.getTableCell(2, 3).find('a').should('contain.text', '+ 1 more')
    page.getTableCell(1, 4).should('contain.text', '27 March 2025').should('contain.text', '9:30am')
    page
      .getTableCell(1, 5)
      .find('a')
      .should('contain.text', 'Log an outcome')
      .should('have.attr', 'target', '_blank')
      .should(
        'have.attr',
        'href',
        'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=1',
      )
    cy.get('.govuk-pagination').should('exist')
    page
      .getPaginationItem(1)
      .find('a')
      .should('contain.text', '1')
      .should('have.attr', 'href', '/caseload/appointments/no-outcome?page=0')
      .should('have.attr', 'aria-current', 'page')
  })

  it('Outcomes to log page is rendered with no results', () => {
    cy.task('stubNoOutcomesToLog')
    cy.visit('/caseload/appointments/no-outcome')
    const page = new UserAppointments()
    page.setPageTitle('Outcomes to log')
    cy.get('p').should('contain.text', 'No outcomes to log.')
    cy.get('table').should('not.exist')
    cy.get('.govuk-pagination').should('not.exist')
  })
})
