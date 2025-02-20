import Page, { PageElement } from './page'

export default class ActivityLogPage extends Page {
  constructor() {
    super('Activity log')
  }

  getSelectedFiltersBox = (): PageElement => cy.get('.moj-filter__selected')

  getApplyFiltersButton = (): PageElement => cy.get('[data-qa="submit-button"]')

  getKeywordsInput = (): PageElement => cy.get('[data-qa="keywords"] input')

  getDateFromInput = (): PageElement => cy.get('[data-qa="date-from"] input')

  getDateFromToggle = (): PageElement => cy.get('[data-qa="date-from"] .moj-datepicker__toggle')

  getDateFromDialog = (): PageElement => cy.get('[data-qa="date-from"] .moj-datepicker__dialog')

  getDateToInput = (): PageElement => cy.get('[data-qa="date-to"] input')

  getDateToToggle = (): PageElement => cy.get('[data-qa="date-to"] .moj-datepicker__toggle')

  getDateToDialog = (): PageElement => cy.get('[data-qa="date-to"] .moj-datepicker__dialog')

  getSelectedFilterTagsList = (listIndex = 0): PageElement => cy.get('.moj-filter-tags').eq(listIndex)

  getSelectedFilterTag = (listIndex = 0, index = 0) =>
    cy.get(`.moj-filter-tags`).eq(listIndex).find(`li`).eq(index).find('a')

  getActivity = (index: string): PageElement => cy.get(`[data-qa=timeline${index}Card]`)

  getContactTypeFilter = (index: number): PageElement =>
    cy.get(`[data-qa="contact-type"] .govuk-checkboxes__item:nth-of-type(${index}) input`)

  getContactStatusFilter = (index: number): PageElement =>
    cy.get(`[data-qa="contact-status"] .govuk-checkboxes__item:nth-of-type(${index}) input`)

  getPaginationLink = (index: number): PageElement => cy.get(`.govuk-pagination li:nth-of-type(${index}) a`)

  getPaginationItem = (index: number): PageElement => cy.get(`.govuk-pagination li:nth-of-type(${index})`)

  getTimelineCard = (index: number): PageElement => cy.get(`.app-summary-card:nth-type-of(${index})`)

  getNoResults = (): PageElement => cy.get('[data-qa="no-results"]')
}
