import UserAppointments from '../../pages/userAppointments'
import { getWiremockData, Wiremock } from '../../utils'
import { UserActivity } from '../../../server/data/model/userSchedule'
import mockResponse from '../../../wiremock/mappings/user-schedule.json'
import { yearsSince } from '../../../server/utils'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'

const mockData = mockResponse as Wiremock

const mockAppointments = getWiremockData<UserActivity[]>(
  mockData,
  '/mas/user/USER1/schedule/no-outcome',
  'appointments',
)

const checkColumnHeading = (
  page: UserAppointments,
  index: number,
  label: string,
  name: string,
  action: string,
  sort = 'none',
) => {
  page.getTableColumnHeading(index).should('contain.text', label)
  page.getTableColumnHeading(index).should('have.attr', 'aria-sort', sort)
  page.getTableColumnHeading(index).should('have.attr', 'data-sort-name', name)
  page.getTableColumnHeading(index).should('have.attr', 'data-sort-action', action)
  page.getTableColumnHeading(index).find('button').should('exist')
}

const checkColumnSorting = (page: UserAppointments, index: number) => {
  const firstSort = index < 3 ? 'ascending' : 'descending'
  const secondSort = index < 3 ? 'descending' : 'ascending'
  page.getTableColumnHeading(index).find('button').click()
  page.getTableColumnHeading(index).should('have.attr', 'aria-sort', firstSort)
  page.getTableCell(1, 1).find('a').should('contain.text', 'Berge, Alton').should('have.attr', 'href', '/case/X778160')
  page.getTableColumnHeading(index).find('button').click()
  page.getTableColumnHeading(index).should('have.attr', 'aria-sort', secondSort)
  page.getTableCell(1, 1).find('a').should('contain.text', 'Berge, Alton').should('have.attr', 'href', '/case/X778160')
}

context('Outcomes to log', () => {
  afterEach(() => {
    cy.task('resetMocks')
  })
  it('Outcomes to log page is rendered', () => {
    cy.visit('/caseload/appointments/no-outcome')
    const page = new UserAppointments()
    page.checkPageTitle('Outcomes to log')
    checkColumnHeading(page, 0, 'Name / CRN', 'name', '/caseload/appointments/no-outcome')
    checkColumnHeading(page, 1, 'DOB / Age', 'dob', '/caseload/appointments/no-outcome')
    checkColumnHeading(page, 2, 'Sentence', 'sentence', '/caseload/appointments/no-outcome')
    checkColumnHeading(page, 3, 'Date and time', 'date', '/caseload/appointments/no-outcome', 'ascending')
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
      .should('contain.text', 'Manage on NDelius')
      .should('have.attr', 'target', '_blank')
      .should(
        'have.attr',
        'href',
        '/case/X778160/appointments/appointment/1/manage?back=/caseload/appointments/no-outcome',
      )
    page
      .getTableCell(2, 5)
      .find('a')
      .should('contain.text', 'Log an outcome')
      .should(
        'have.attr',
        'href',
        'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X801756&contactID=2',
      )
      .should('have.attr', 'target', '_blank')
    cy.get('.govuk-pagination').should('exist')
    page
      .getPaginationItem(1)
      .find('a')
      .should('contain.text', '1')
      .should('have.attr', 'href', '/caseload/appointments/no-outcome?page=0')
      .should('have.attr', 'aria-current', 'page')
  })
  const sortableColumns = ['Name / CRN', 'DOB / Age', 'Sentence', 'Date and time']
  for (let i = 0; i < sortableColumns.length; i += 1) {
    it(`should request the sorted results from the api and re-render the page when ${sortableColumns[i - 1]} sort button is clicked`, () => {
      cy.visit('/caseload/appointments/no-outcome')
      const page = new UserAppointments()
      checkColumnSorting(page, i)
    })
  }

  it('Outcomes to log page is rendered with no results', () => {
    cy.task('stubNoOutcomesToLog')
    cy.visit('/caseload/appointments/no-outcome')
    const page = new UserAppointments()
    page.checkPageTitle('Outcomes to log')
    cy.get('p').should('contain.text', 'No outcomes to log.')
    cy.get('table').should('not.exist')
    cy.get('.govuk-pagination').should('not.exist')
  })

  it('BackLink is correct when logging an outcome', () => {
    cy.visit('/caseload/appointments/no-outcome')
    const page = new UserAppointments()
    page.getTableCell(1, 5).find('a').click()
    const managePage = new ManageAppointmentPage()
    managePage.getBackLink().click()
    page.checkPageTitle('Outcomes to log')
  })
})
