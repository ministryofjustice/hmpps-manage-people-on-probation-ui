import Page, { PageElement } from '../page'

export default class UploadAPhotoPage extends Page {
  constructor() {
    super('Upload a photo of Caroline')
  }

  getBackLink = (): PageElement => cy.get('.govuk-back-link')
}
