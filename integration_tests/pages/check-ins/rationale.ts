import Page, { PageElement } from '../page'

export default class RationalePage extends Page {
  constructor() {
    super('suitable to use online check ins?')
  }

  rationaleNotes = () => cy.get('[data-qa="rationale-for-check-ins"]')

  getSubmitBtn = (): PageElement => cy.get('[data-qa="submit-btn"]')

  checkOnPage(): void {
    cy.contains('label', 'suitable to use online check ins?').should('be.visible')
  }
}
