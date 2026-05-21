import Page, { PageElement } from '../page'

export default class AcceptableAbsencePage extends Page {
  getBreachWarning = (): PageElement => cy.get('[data-qa="breach-warning"]')
}
