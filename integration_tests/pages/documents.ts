import Page, { PageElement } from './page'

export default class DocumentsPage extends Page {
  constructor() {
    super('Documents')
  }

  getFileNameInput = (): PageElement => cy.get('[data-qa="fileName"] input')

  getDateFromInput = (): PageElement => cy.get('[data-qa="dateFrom"] input')

  getDateToInput = (): PageElement => cy.get('[data-qa="dateTo"] input')

  getApplyFiltersButton = (): PageElement => cy.get('[data-qa="submit-button"]')

  getSelectedFilterTag = (index: number) => cy.get(`.moj-filter-tags li:nth-of-type(${index}) a`)

  getClearAllLink = (crn: string) => cy.get(`a[href="/case/${crn}/documents?clear=all"]`)
}
