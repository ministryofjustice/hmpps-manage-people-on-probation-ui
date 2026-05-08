import Page, { PageElement } from './page'

export default class SentencePage extends Page {
  constructor() {
    super('Sentence')
  }

  activeSideNavItem = (): PageElement => cy.get('.moj-side-navigation__item--active a')

  noActiveSentence = (): PageElement => cy.get('[data-qa="no-active-sentence"]')

  getRequirementLabel = (requirementIndex: number, index: number): PageElement =>
    cy.get(
      `[data-qa="requirementsValue"] details:nth-of-type(${requirementIndex}) .govuk-summary-list__row:nth-of-type(${index}) dt`,
    )

  getRequirementValue = (requirementIndex: number, index: number): PageElement =>
    cy.get(
      `[data-qa="requirementsValue"] details:nth-of-type(${requirementIndex}) .govuk-summary-list__row:nth-of-type(${index}) dd`,
    )
}
