import Page, { PageElement } from '../../page'

export default class RestartEditContactPreferencePage extends Page {
  constructor() {
    super('Edit contact details for Alton')
  }

  getMobileInput = (): PageElement => this.getElementInput('mobileNumber')

  getEmailInput = (): PageElement => this.getElementInput('editEmail')

  getSubmitBtn = (): PageElement => cy.get('[data-qa="submit-btn"]')

  getCancelAndGoBckBtn = (): PageElement => cy.get('[data-qa="formAnchorLink"]')
}
