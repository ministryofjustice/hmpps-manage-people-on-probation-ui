import Page, { PageElement } from './page'

export default class ActivityLogPage extends Page {
  constructor() {
    super('Contacts')
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

  getSelectedFilterTags = (): PageElement => cy.get('.moj-filter__tag')

  getSelectedFilterTag = (index: number) => cy.get(`.moj-filter-tags li:nth-of-type(${index}) a`)

  getActivity = (index: string): PageElement => cy.get('.contact-activity').eq(parseInt(index, 10) - 1)

  getActivityTitle = (index: number): PageElement =>
    cy.get('.contact-activity').eq(index).find('.govuk-details__summary-text span').first()

  getActivityViewLink = (index: number): PageElement =>
    cy.get('.contact-activity').eq(index).find('.contact-activity__actions a').first()

  getActivityViewNoNotes = (index: number): PageElement =>
    cy.get('.contact-activity').eq(index).find('.contact-activity--noNotes a').first()

  getComplianceFilter = (index: number): PageElement =>
    cy.get(`[data-qa="compliance"] .govuk-checkboxes__item:nth-of-type(${index}) input`)

  getPaginationLink = (index: number): PageElement => cy.get(`.govuk-pagination li:nth-of-type(${index}) a`)

  getPaginationItem = (index: number): PageElement => cy.get(`.govuk-pagination li:nth-of-type(${index})`)

  getNoResults = (): PageElement => cy.get('[data-qa="no-results"]')

  getTimelineCard = (index: number): PageElement => cy.get(`[data-qa="timeline${index}Card"]`)

  getTimelineCardViewLink = (index: number): PageElement =>
    cy.get(`[data-qa="timeline${index}Card"]`).find('.contact-activity__actions a').first()
}
