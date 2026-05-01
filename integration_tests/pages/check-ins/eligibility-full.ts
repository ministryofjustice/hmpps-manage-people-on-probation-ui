import Page, { PageElement } from '../page'

export default class EligibilityFullPage extends Page {
  constructor() {
    super('is eligible to use online check ins')
  }

  getSubmitBtn = (): PageElement => cy.get('[data-qa="submit-btn"]')

  getReplacementRadio = (): PageElement => cy.get('input[value="replacement-contact"]')

  getSupplementaryRadio = (): PageElement => cy.get('input[value="supplementary-contact"]')
}
