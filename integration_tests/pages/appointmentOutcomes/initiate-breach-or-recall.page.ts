import Page, { PageElement } from '../page'

export default class InitiateBreachOrRecallPage extends Page {
  getBreachWarning = (): PageElement => cy.get('[data-qa="breach-warning"]')
}
