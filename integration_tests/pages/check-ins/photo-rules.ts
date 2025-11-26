import Page, { PageElement } from '../page'

export default class PhotoRulesPage extends Page {
  constructor() {
    super('Does this photo meet the rules?')
  }

  getPhotoOptions = () => {
    return cy.get(`[data-qa="uploadOptions"]`)
  }

  getBackLink = (): PageElement => cy.get('.govuk-back-link')
}
