import Page, { PageElement } from './page'

export default class UpcomingAppointments extends Page {
  constructor() {
    super('My upcoming appointments')
  }

  getTableColumnHeading = (index: number): PageElement => cy.get('table thead th').eq(index)

  getTableCell = (rowIndex: number, columnIndex: number): PageElement =>
    cy.get(`table tr:nth-of-type(${rowIndex}) td:nth-of-type(${columnIndex})`)

  getPaginationItem = (index: number): PageElement => cy.get('.govuk-pagination__list li').eq(index - 1)
}
