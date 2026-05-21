import Page, { PageElement } from '../page'

export default class UnacceptableAbsencePage extends Page {
  getBreachWarning = (): PageElement => cy.get('[data-qa="breach-warning"]')
}
