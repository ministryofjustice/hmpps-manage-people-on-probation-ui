import Page, { PageElement } from '../page'

export default class ContactPreferencePage extends Page {
  constructor() {
    super('Contact preferences')
  }

  getSubmitBtn = (): PageElement => cy.get('[data-qa="submitBtn"]')

  getChangeLink = (): PageElement => cy.get('[data-qa="mobileNumberAction"]')

  getCheckInPreferredComs = () => {
    return cy.get(`[data-qa="checkInPreferredComs"]`)
  }
}
