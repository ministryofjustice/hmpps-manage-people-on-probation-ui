import Page, { PageElement } from '../page'

export default class EnforcementActionPage extends Page {
  getBreachWarning = (): PageElement => cy.get('[data-qa="breach-warning"]')
}
