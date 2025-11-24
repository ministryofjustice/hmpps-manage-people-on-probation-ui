import Page, { PageElement } from '../page'

export default class TakeAPhotoOptionsPage extends Page {
  constructor() {
    super('Take a photo of Caroline')
  }

  getPhotoOptions = () => {
    return cy.get(`[data-qa="uploadOptions"]`)
  }

  getBackLink = (): PageElement => cy.get('.govuk-back-link')
}
