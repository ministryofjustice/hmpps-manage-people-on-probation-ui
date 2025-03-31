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
  const firstSort = index < 4 ? 'ascending' : 'descending'
  const secondSort = index < 4 ? 'descending' : 'ascending'
  page.getColumnHeader('myCases', index).find('button').click()
  page.getColumnHeader('myCases', index).should('have.attr', 'aria-sort', firstSort)
  page.getRowData('myCases', 'nameOrCrn', 'Value1').should('contain.text', 'X778160')
  page
    .getRowData('myCases', 'nameOrCrn', 'Value1')
    .find('a')
    .should('contain.text', 'Berge, Alton')
    .should('have.attr', 'href', './case/X778160')
  page.getColumnHeader('myCases', index).find('button').click()
  page.getColumnHeader('myCases', index).should('have.attr', 'aria-sort', secondSort)
  page.getRowData('myCases', 'nameOrCrn', 'Value1').should('contain.text', 'X778160')
  page
    .getRowData('myCases', 'nameOrCrn', 'Value1')
    .find('a')
    .should('contain.text', 'Berge, Alton')
    .should('have.attr', 'href', './case/X778160')
}

context('Cases', () => {
  it('Cases page is rendered ', () => {
    cy.visit('/case')
    const page = Page.verifyOnPage(YourCasesPage)
    checkColumnHeading(page, 0, 'Name / CRN', 'nameOrCrn', 'case')
    checkColumnHeading(page, 1, 'DOB / Age', 'dob', 'case')
    checkColumnHeading(page, 2, 'Sentence', 'sentence', 'case')
    checkColumnHeading(page, 3, 'Last contact', 'lastContact', 'case')
    checkColumnHeading(page, 4, 'Next contact', 'nextContact', 'case', 'ascending')
    page.getRowData('myCases', 'nameOrCrn', 'Value1').should('contain.text', 'X778160')
    page.getRowData('myCases', 'dob', 'Value1').should('contain.text', '25 Sep 1975')
    page.getRowData('myCases', 'nameOrCrn', 'Value4').should('contain.text', 'Restricted access')
    page.getRowData('myCases', 'nameOrCrn', 'Value4').should('contain.text', 'X808126')
    page.getRowData('myCases', 'dob', 'Value4').should('contain.text', 'Restricted')
    page.getPagination().should('contain.text', 'Showing 1 to 10 of 33 cases.')
    page.getNavigationLink(1).should('contain.text', 'Home')
    page.getNavigationLink(1).should('not.have.attr', 'aria-current', 'home')
    page.getNavigationLink(2).should('contain.text', 'Cases')
    page.getNavigationLink(2).should('have.attr', 'aria-current', 'cases')
    page.getNavigationLink(3).should('contain.text', 'Search')
    page.getNavigationLink(3).should('not.have.attr', 'aria-current', 'search')
  })

  const sortableColumns = ['Name / CRN', 'DOB / Age', 'Sentence', 'Last contact', 'Next contact']
  for (let i = 0; i < sortableColumns.length; i += 1) {
    it(`should request the sorted results from the api and re-render the page when ${sortableColumns[i - 1]} sort button is clicked`, () => {
      cy.visit('/case')
      const page = new YourCasesPage()
      checkColumnSorting(page, i)
    })
  }
})
