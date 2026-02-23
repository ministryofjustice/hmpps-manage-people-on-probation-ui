import Page, { PageElement } from '../page'

export default class ManageEditContactPage extends Page {
  constructor() {
    super('Edit contact details for Alton')
  }

  getAlert = (): PageElement => cy.get('[data-qa="updateBanner"]')
}
