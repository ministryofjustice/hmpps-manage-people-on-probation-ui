import Page, { PageElement } from '../page'

export default class UpdateEnforcementActionPage extends Page {
  getBreachWarning = (): PageElement => cy.get('[data-qa="breach-warning"]')
}
