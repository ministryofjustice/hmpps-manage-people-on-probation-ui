import Page, { PageElement } from './page'

export default class EnforcementActionsPage extends Page {
  getTableColumnHeading = (index: number): PageElement => cy.get('table thead th').eq(index)

  getTableCell = (rowIndex: number, columnIndex: number): PageElement =>
    cy.get(`table tr:nth-of-type(${rowIndex}) td:nth-of-type(${columnIndex})`)

  getPaginationItem = (index: number): PageElement => cy.get('.govuk-pagination__list li').eq(index - 1)

  getNextPage = (): PageElement => cy.get('.govuk-pagination__next')

  getPreviousPage = (): PageElement => cy.get('.govuk-pagination__prev')

  getBackButton = (): PageElement => cy.get('.govuk-back-link')
}
