import Page, { PageElement } from '../page'

export default class FailedToAttendPage extends Page {
  getBreachWarning = (): PageElement => cy.get('[data-qa="breach-warning"]')
}
