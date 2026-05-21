import Page, { PageElement } from '../page'

export default class AttendedFailedToComplyPage extends Page {
  getBreachWarning = (): PageElement => cy.get('[data-qa="breach-warning"]')
}
