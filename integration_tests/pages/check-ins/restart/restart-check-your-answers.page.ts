import Page, { PageElement } from '../../page'

export default class RestartCheckYourAnswersPage extends Page {
  constructor() {
    super('Check your answers before restarting online check ins')
  }

  getSummaryValue = (rowNumber: number) => this.getSummaryListRow(rowNumber).find('.govuk-summary-list__value')

  getDateChangeLink = (): PageElement => this.getElementData('dateAction')

  getBackLink = (): PageElement => cy.get('.govuk-back-link')

  getErrorText = (): PageElement => cy.get('#registration-error-content')
}
