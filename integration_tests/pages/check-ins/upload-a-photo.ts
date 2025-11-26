import Page, { PageElement } from '../page'

export default class UploadAPhotoPage extends Page {
  constructor() {
    super('Upload a photo of Caroline')
  }

  getBackLink = (): PageElement => cy.get('.govuk-back-link')

  fileUploadInput = (): PageElement => cy.get('#photoUpload-input')

  continueButton = (): PageElement => cy.contains('button', 'Continue')

  uploadPhoto = (fixturePath: string): void => {
    this.fileUploadInput().selectFile(`integration_tests/fixtures/${fixturePath}`, { force: true })
  }
}
