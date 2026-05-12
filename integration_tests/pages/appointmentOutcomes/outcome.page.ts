import Page, { PageElement } from '../page'

export default class OutcomePage extends Page {
  constructor() {
    super('What was the outcome of this appointment?')
  }

  getCancelAndGoBckBtn = (): PageElement => cy.get('[data-qa="formAnchorLink"]')
}
