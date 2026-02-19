import Page, { PageElement } from '../page'

export default class EditContactPreferencePage extends Page {
  constructor() {
    super('Edit contact details for Caroline')
  }

  getSubmitBtn = (): PageElement => cy.get('[data-qa="submit-btn"]')

  getCancelAndGoBckBtn = (): PageElement => cy.get('[data-qa="formAnchorLink"]')

  getAlert = (): PageElement => cy.get('[data-qa="updateBanner"]')
}
