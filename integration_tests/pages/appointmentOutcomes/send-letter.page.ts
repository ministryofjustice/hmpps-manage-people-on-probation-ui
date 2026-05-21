import Page, { PageElement } from '../page'

export default class SendLetterPage extends Page {
  constructor() {
    super('Send a letter')
  }

  getBreachWarning = (): PageElement => cy.get('[data-qa="breach-warning"]')
}
