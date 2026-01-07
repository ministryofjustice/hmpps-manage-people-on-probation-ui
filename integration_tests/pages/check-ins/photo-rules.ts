import Page, { PageElement } from '../page'

export default class PhotoRulesPage extends Page {
  constructor() {
    super('Does this photo meet the rules?')
  }

  getAnotherPicBtn = (): PageElement => cy.get('[data-qa="anotherPhotoBtn"]')

  getBackLink = (): PageElement => cy.get('.govuk-back-link')
}
