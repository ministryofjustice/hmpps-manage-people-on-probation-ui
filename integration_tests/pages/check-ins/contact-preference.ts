import Page, { PageElement } from '../page'

export default class ContactPreferencePage extends Page {
  constructor() {
    super('Contact Preferences')
  }

  getSubmitBtn = (): PageElement => cy.get('[data-qa="submitBtn"]')

  getCheckInPreferredComs = () => {
    return cy.get(`[data-qa="checkInPreferredComs"]`)
  }
}
