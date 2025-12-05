import Page, { PageElement } from '../page'

export default class CheckYourAnswersPage extends Page {
  constructor() {
    super('Check your answers before adding Caroline to online check ins')
  }

  getBackLink = (): PageElement => cy.get('.govuk-back-link')

  getErrorText = (): PageElement => cy.get('#registration-error-content')
}
