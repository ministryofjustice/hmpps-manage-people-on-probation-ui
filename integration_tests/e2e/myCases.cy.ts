import { DateTime } from 'luxon'
import Page from '../pages/page'
import YourCasesPage from '../pages/myCases'

const checkColumnHeading = (
  page: YourCasesPage,
  index: number,
  label: string,
  name: string,
  action: string,
  sort = 'none',
) => {
  page.getColumnHeader('myCases', index).should('contain.text', label)
  page.getColumnHeader('myCases', index).should('have.attr', 'aria-sort', sort)
  page.getColumnHeader('myCases', index).should('have.attr', 'data-sort-name', name)
  page.getColumnHeader('myCases', index).should('have.attr', 'data-sort-action', action)
  page.getColumnHeader('myCases', index).find('button').should('exist')
}

const checkColumnSorting = (page: YourCasesPage, index: number) => {
  const firstSort = index < 3 ? 'ascending' : 'descending'
  const secondSort = index < 3 ? 'descending' : 'ascending'
  page.getColumnHeader('myCases', index).find('button').click()
  page.getColumnHeader('myCases', index).should('have.attr', 'aria-sort', firstSort)
  page.getRowData('myCases', 'nameOrCrn', 'Value1').should('contain.text', 'X778160')
  page
    .getRowData('myCases', 'nameOrCrn', 'Value1')
    .find('a')
    .should('contain.text', 'Berge, Alton')
    .should('have.attr', 'href', '/case/X778160')
  page.getColumnHeader('myCases', index).find('button').click()
  page.getColumnHeader('myCases', index).should('have.attr', 'aria-sort', secondSort)
  page.getRowData('myCases', 'nameOrCrn', 'Value1').should('contain.text', 'X778160')
  page
    .getRowData('myCases', 'nameOrCrn', 'Value1')
    .find('a')
    .should('contain.text', 'Berge, Alton')
    .should('have.attr', 'href', '/case/X778160')
}

context('Cases', () => {
  afterEach(() => {
    cy.task('resetMocks')
  })
  it('Cases page is rendered ', () => {
    const now = DateTime.now()
    const allocatedOn = now.toFormat('yyyy-MM-dd')
    cy.task('stubCaseload', allocatedOn)
    cy.visit('/case')
    const page = Page.verifyOnPage(YourCasesPage)
    checkColumnHeading(page, 0, 'Cases', 'nameOrCrn', 'case')
    checkColumnHeading(page, 1, 'Sentence', 'sentence', 'case')
    checkColumnHeading(page, 2, 'Last Appointment', 'lastContact', 'case')
    checkColumnHeading(page, 3, 'Next Appointment', 'nextContact', 'case', 'ascending')
    page.getRowData('myCases', 'nameOrCrn', 'Value1').should('contain.text', 'X778160')
    page.getRowData('myCases', 'nameOrCrn', 'Value1').should('contain.text', '25 September 1975')
    page.getRowData('myCases', 'nameOrCrn', 'Value4').should('contain.text', 'Restricted access')
    page.getRowData('myCases', 'nameOrCrn', 'Value4').should('contain.text', 'X808126')
    page.getRowData('myCases', 'nameOrCrn', 'Value4').should('contain.text', 'Restricted')
    page.getPagination().should('contain.text', 'Showing 1 to 10 of 33 cases.')
    page.getNavigationLink(1).should('contain.text', 'Home')
    page.getNavigationLink(1).should('not.have.attr', 'aria-current', 'home')
    page.getNavigationLink(2).should('contain.text', 'Cases')
    page.getNavigationLink(2).should('have.attr', 'aria-current', 'cases')
    page.getNavigationLink(3).should('contain.text', 'Search')
    page.getNavigationLink(3).should('not.have.attr', 'aria-current', 'search')
    page.getNavigationLink(4).should('contain.text', 'Alerts')
    page.getNavigationLink(4).get('.moj-notification-badge').should('contain.text', 12)
    page.getNavigationLink(4).should('not.have.attr', 'aria-current', 'alerts')
    cy.get('.govuk-tag--yellow').should('contain.text', 'New case')
  })

  const sortableColumns = ['Cases', 'Sentence', 'Last Appointment', 'Next Appointment']
  for (let i = 0; i < sortableColumns.length; i += 1) {
    it(`should request the sorted results from the api and re-render the page when ${sortableColumns[i]} sort button is clicked`, () => {
      cy.visit('/case')
      const page = new YourCasesPage()
      checkColumnSorting(page, i)
    })
  }
})
