import Page, { PageElement } from '../page'

export default class PhotoOptionsPage extends Page {
  constructor() {
    super('Take a photo of Caroline')
  }

  getBackLink = (): PageElement => cy.get('.govuk-back-link')
}
