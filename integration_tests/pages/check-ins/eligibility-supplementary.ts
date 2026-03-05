import Page, { PageElement } from '../page'

export default class EligibilitySupplementaryPage extends Page {
  constructor() {
    super('is eligible to use online check ins as well as existing face-to-face contact')
  }

  getSubmitBtn = (): PageElement => cy.get('[data-qa="submit-btn"]')
}
